#pragma once


#include <string>
#include <fstream>
#include <nlohmann/json.hpp>
#include <filesystem>


class block_manager {
	static inline std::string path() {
		return "storage/blocks";
	}


public:
	static bool set_order(const std::string& block, nlohmann::json&& data) noexcept {
		std::string pth = path() + '/' + block + "/order.json";
		std::ofstream file{ pth };

		try {
			file << data.dump();

			return true;
		}
		catch (...) {
			return false;
		}
	}


	static nlohmann::json get_order(const std::string& block) noexcept {
		std::string pth = path() + '/' + block + "/order.json";
		std::ifstream file{ pth };

		try {
			return nlohmann::json::parse(file);
		}
		catch (...) {
			return nlohmann::json::array();
		}
	}


	static nlohmann::json get_all(const std::string& block) noexcept {
		std::string pth = path() + '/' + block;
		std::vector<std::string> folders;

		auto dir = std::filesystem::directory_iterator(pth);
		for (const auto& entry : dir)
			if (entry.is_directory()) folders.push_back(entry.path().filename().string());

		return folders;
	}


	static bool set_content(const std::string& block, std::string&& name, nlohmann::json&& data) noexcept {
		std::string pth = path() + '/' + block + '/' + name + "/content.json";
		std::ofstream file{ pth };

		try {
			file << data.dump();

			return true;
		}
		catch (...) {
			return false;
		}
	}


	static nlohmann::json get_content(const std::string& block, std::string&& name) noexcept {
		std::string pth = path() + '/' + block + '/' + name + "/content.json";
		std::ifstream file{ pth };

		try {
			return nlohmann::json::parse(file);
		}
		catch (...) {
			return nlohmann::json();
		}
	}


	static std::filesystem::path get_attachment(const std::string& block, std::string&& name, std::string&& attachment) noexcept {
		std::string pth = path() + '/' + block + '/' + name;

		auto dir = std::filesystem::directory_iterator(pth);
		for (const auto& entry : dir) {
			if (!entry.is_directory()) {
				std::filesystem::path entry_path = entry.path();
				if (entry_path.stem().string() == attachment) return entry_path;
			}
		}

		return std::filesystem::path();
	}


	static bool delete_attachment(const std::string& block, std::string&& name, std::string&& attachment) noexcept {
		std::string pth = path() + '/' + block + '/' + name;

		auto dir = std::filesystem::directory_iterator(pth);
		for (const auto& entry : dir) {
			if (!entry.is_directory()) {
				std::filesystem::path entry_path = entry.path();
				if (entry_path.stem().string() == attachment) {
					std::filesystem::remove(entry_path);

					return true;
				}
			}
		}

		return false;
	}


	static bool add_attachment(const std::string& block, std::string&& name, std::string&& attachment, std::string&& extension, std::vector<char>&& data) noexcept {
		std::string pth = path() + '/' + block + '/' + name + '/' + attachment + extension;

		try {
			delete_attachment(block, std::move(name), std::move(attachment));

			std::ofstream file{ pth, std::ios::binary };
			file.write(reinterpret_cast<const char*>(data.data()), data.size());

			return true;
		}
		catch (...) {
			return false;
		}
	}


	static nlohmann::json get_actives(const std::string& block, std::string&& name, std::vector<std::string>&& whitelist) {
		std::string pth = path() + '/' + block + '/' + name;
		std::vector<std::string> files;

		auto dir = std::filesystem::directory_iterator(pth);
		for (const auto& entry : dir) {
			if (!entry.is_directory()) {
				std::string name = entry.path().stem().string();
				if (std::find(whitelist.begin(), whitelist.end(), name) != whitelist.end())
					files.push_back(name);
			}
		}

		return files;
	}


	static bool create(const std::string& block, std::string&& name) {
		std::string pth = path() + '/' + block + '/' + name;

		try {
			std::filesystem::create_directory(pth);

			return true;
		}
		catch (...) {
			return false;
		}
	}


	static bool remove(const std::string& block, std::string&& name) {
		std::string pth = path() + '/' + block + '/' + name;

		try {
			std::filesystem::remove_all(pth);

			nlohmann::json order = get_order(block);

			order.erase(
				std::remove(order.begin(), order.end(), nlohmann::json(name)),
				order.end()
			);

			set_order(block, std::move(order));

			return true;
		}
		catch (...) {
			return false;
		}
	}
};