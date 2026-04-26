#pragma once


#include "../fals/main_server.hpp"
#include <nlohmann/json.hpp>
#include <filesystem>
#include "../global/admin_controller.hpp"


class Locale {
public:
	std::string _name;
	std::vector<std::string> _fields;


	Locale(std::string&& name, std::vector<std::string>&& fields) : _name(name), _fields(fields) {
		if (name == "list") {
			throw std::runtime_error("Name \"list\" is reserved for base needs");
		}

		get_locales().push_back(this);

		std::string path = get_this_file();
		if (!std::filesystem::exists(path)) {
			nlohmann::json js;

			for (std::string& field : _fields) {
				js[field] = "";
			}

			std::ofstream file{ path };
			file << js.dump();
		}
	}


	static std::vector<Locale*>& get_locales() {
		static std::vector<Locale* > locales;

		return locales;
	}


	std::string get_this_file() const {
		std::string res;
		res += "storage/locales/";
		res += _name;
		res += ".json";

		return res;
	}


	std::shared_ptr<server_response> get(std::shared_ptr<server_request> request) {
		std::string path = get_this_file();
		if (!std::filesystem::exists(path))
			return text_resp(
				request->socket,
				404,
				"Not Found",
				"text/plain",
				"Not Found"
			);


		return file_resp(
			request->socket,
			200,
			"OK",
			"application/json",
			path,
			"locale.json",
			OpenType::INLINE
		);
	}


	std::shared_ptr<server_response> set(std::shared_ptr<server_request> request) {
		std::string path = get_this_file();
		if (!std::filesystem::exists(path))
			return text_resp(
				request->socket,
				404,
				"Not Found",
				"text/plain",
				"Not Found"
			);

		auto secret = request->get_form_by_key("secret");
		if (secret.empty() || secret.value != fals_GLOBAL::secret)
			return text_resp();

		auto data = request->get_form_by_key("data");
		if (data.empty())
			return text_resp(
				request->socket,
				400,
				"Bad Request",
				"text/plain",
				"Bad Request"
			);

		nlohmann::json edit = nlohmann::json::parse(data.value);
		nlohmann::json updated;

		{
			std::ifstream ifile{ path };
			updated = nlohmann::json::parse(ifile);


			for (auto it = edit.begin(); it != edit.end(); ++it) {
				std::string key = it.key();

				if (std::find(_fields.begin(), _fields.end(), key) != _fields.end())
					updated[key] = it.value();
			}
		}
		
		std::ofstream ofile{ path };
		ofile << updated.dump();

		return text_resp(request->socket, 200, "OK", "plain/text", "OK");
	}
};