#pragma once


#include <string>
#include <fstream>
#include <nlohmann/json.hpp>
#include <filesystem>


class locale_manager {
	static inline std::string path() {
		return "storage/locales";
	}


public:
	static nlohmann::ordered_json get_locale(const std::string& locale) {
		std::string pth = path() + '/' + locale + ".json";
		std::ifstream file{ pth };

		try {
			return nlohmann::ordered_json::parse(file);
		}
		catch (...) {
			return nlohmann::ordered_json();
		}
	}


	static bool set_locale(const std::string& locale, nlohmann::ordered_json&& data) {
		std::string pth = path() + '/' + locale + ".json";
		std::ofstream file{ pth };

		try {
			file << data;

			return true;
		}
		catch (...) {
			return false;
		}
	}
};