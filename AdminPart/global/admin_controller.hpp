#pragma once


#include "../internal.hpp"


#include <nlohmann/json.hpp>
#include <fstream>
#include <openssl/sha.h>
#include <openssl/evp.h>


class fals_GLOBAL {
	static std::string toHex(const unsigned char* hash, int len) {
		std::stringstream ss;
		for (int i = 0; i < len; i++) {
			ss << std::hex << std::setw(2) << std::setfill('0') << (int)hash[i];
		}
		return ss.str();
	}


public:
	static inline std::string secret{ "default-secret-key" };


	static std::string get_this_file() {
		return "storage/globals/settings.json";
	}


	static std::string hash_string(std::string&& string) {
		return hash_string(string);
	}

	static std::string hash_string(const std::string& string) {
		EVP_MD_CTX* ctx = EVP_MD_CTX_new();
		if (!ctx) {
			return "";
		}

		const EVP_MD* md = EVP_sha256();
		if (!md) {
			EVP_MD_CTX_free(ctx);
			return "";
		}

		if (EVP_DigestInit_ex(ctx, md, nullptr) != 1) {
			EVP_MD_CTX_free(ctx);
			return "";
		}

		if (EVP_DigestUpdate(ctx, string.c_str(), string.size()) != 1) {
			EVP_MD_CTX_free(ctx);
			return "";
		}

		unsigned char hash[EVP_MAX_MD_SIZE];
		unsigned int hashLen = 0;

		if (EVP_DigestFinal_ex(ctx, hash, &hashLen) != 1) {
			EVP_MD_CTX_free(ctx);
			return "";
		}

		EVP_MD_CTX_free(ctx);

		return toHex(hash, hashLen);
	}


	static bool is_secret(std::string&& string) {
		return hash_string(std::move(string)) == secret;
	}


	static void change_secret(const std::string& new_secret) {
		std::string path = get_this_file();

		nlohmann::json js;

		{
			std::ifstream ifile{ path };
			if (ifile.is_open())
				js = nlohmann::json::parse(ifile);
		}

		secret = new_secret;
		js["secret"] = secret;

		std::ofstream ofile{ path };
		ofile << js.dump();

	}


	static void init() {
		std::string path = get_this_file();

		if (std::filesystem::exists(path)) {
			std::ifstream ifile{ path };
			nlohmann::json js = nlohmann::json::parse(ifile);

			if (js.contains("secret")) {
				secret = js["secret"];
			}
		}

		fals::mkdir_if_not_exists("storage");
		fals::mkdir_if_not_exists("storage/globals");
	}
};