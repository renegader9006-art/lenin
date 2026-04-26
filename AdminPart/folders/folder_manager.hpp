#pragma once


#include <string>
#include <filesystem>
#include <fstream>
#include <nlohmann/json.hpp>


class folder_manager {
	static inline std::string path() {
		return "storage/folders";
	}


public:
	static bool delete_file(const std::string& folder, std::string&& attachment) {
		std::string pth = path() + '/' + folder;

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


	static bool add_file(const std::string& folder, std::string&& attachment, std::string&& extension, std::vector<char>&& data) noexcept {
		std::string pth = path() + '/' + folder + '/' + attachment + extension;

		try {
			delete_file(folder, std::move(attachment));

			std::ofstream file{ pth, std::ios::binary };
			file.write(reinterpret_cast<const char*>(data.data()), data.size());

			return true;
		}
		catch (...) {
			return false;
		}
	}


	static std::filesystem::path get_file(const std::string& folder, std::string&& attachment) {
		std::string pth = path() + '/' + folder;

		auto dir = std::filesystem::directory_iterator(pth);
		for (const auto& entry : dir) {
			if (!entry.is_directory()) {
				std::filesystem::path entry_path = entry.path();
				
				if (entry_path.filename().stem().string() == attachment) return entry_path;
			}
		}

		return std::filesystem::path();
	}


	static nlohmann::json get_files(const std::string& folder) {
		std::string pth = path() + '/' + folder;
		nlohmann::json arr = nlohmann::json::array();
		
		auto dir = std::filesystem::directory_iterator(pth);
		for (const auto& entry : dir) {
			if (!entry.is_directory()) {
				nlohmann::json js;
				
				js["name"] = entry.path().filename().string();
				js["size"] = entry.file_size();

				arr.push_back(js);
			}
		}

		return arr;
	}
};