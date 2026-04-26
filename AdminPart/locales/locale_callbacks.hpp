#pragma once


#include "../fals/main_server.hpp"
#include "../global/admin_controller.hpp"
#include "locale_manager.hpp"

class Locale {
public:
	std::string name_;
	std::vector<std::string> fields_;


	Locale(std::string&& name, std::vector<std::string>&& fields) : name_(name), fields_(fields) {
		if (name == "list") {
			throw std::runtime_error("Name \"list\" is reserved for base needs");
		}

		get_locales().push_back(this);

		std::string path = get_this_file();
		if (!std::filesystem::exists(path)) {
			nlohmann::ordered_json js;

			for (std::string& field : fields_) {
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
		res += name_;
		res += ".json";

		return res;
	}


	std::shared_ptr<server_response> get(std::shared_ptr<server_request> request) {
		nlohmann::ordered_json js = locale_manager::get_locale(name_);
		if (js.empty())
			return text_resp(
				request->socket,
				404,
				"Not Found",
				"text/plain",
				"Not Found"
			);


		return text_resp(
			request->socket,
			200,
			"OK",
			"application/json",
			js.dump()
		);
	}


	std::shared_ptr<server_response> set(std::shared_ptr<server_request> request) {
		auto data = request->get_form_by_key("data");
		if (data.empty())
			return text_resp(
				request->socket,
				400,
				"Bad Request",
				"text/plain",
				"Bad Request"
			);

		nlohmann::ordered_json updated = locale_manager::get_locale(name_);

		try {
			nlohmann::ordered_json edit = nlohmann::ordered_json::parse(data.value);

			for (auto it = edit.begin(); it != edit.end(); ++it) {
				std::string key = it.key();

				if (std::find(fields_.begin(), fields_.end(), key) != fields_.end())
					updated[key] = it.value();
			}

			locale_manager::set_locale(name_, std::move(updated));

			return text_resp(
				request->socket,
				200,
				"OK",
				"application/json",
				"OK"
			);
		}
		catch (...) {
			return text_resp(
				request->socket,
				400,
				"Bad Request",
				"text/plain",
				"Bad Request"
			);
		}
	}
};