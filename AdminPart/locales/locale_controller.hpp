#pragma once


#include "../fals/main_server.hpp"
#include "locale_callbacks.hpp"


class fals_LOCALE {
public:
	static std::shared_ptr<server_response> process_get(req request) {
		if (request->api.size() == 4) {
			auto locales = Locale::get_locales();

			if (request->api[3] == "list") {
				if (!request->query.contains("secret") || !fals_GLOBAL::is_secret(std::move(request->query["secret"])))
					return text_resp();

				nlohmann::json js = nlohmann::json::array();

				for (Locale* locale : locales) {
					js.push_back(locale->name_);
				}

				return text_resp(request->socket, 200, "OK", "application/json", js.dump());
			}

			auto locale = std::find_if(locales.begin(), locales.end(), [&](Locale* locale) {
				return locale->name_ == request->api[3];
			});

			if (locale != locales.end()) {
				return (*locale)->get(request);
			}
		}

		return text_resp();
	}


	static std::shared_ptr<server_response> process_post(req request) {
		auto secret = request->get_form_by_key("secret");
		if (secret.empty() || !fals_GLOBAL::is_secret(std::move(secret.value)))
			return text_resp();

		if (request->api.size() == 4) {
			auto locales = Locale::get_locales();

			auto locale = std::find_if(locales.begin(), locales.end(), [&](Locale* locale) {
				return locale->name_ == request->api[3];
				});

			if (locale != locales.end()) {
				return (*locale)->set(request);
			}
		}

		return text_resp();
	}


	static void init() {
		fals::mkdir_if_not_exists("storage");
		fals::mkdir_if_not_exists("storage/locales");
	}
};