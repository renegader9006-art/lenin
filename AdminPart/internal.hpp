#pragma once


#include <string>
#include <filesystem>

namespace fals {
	inline void mkdir_if_not_exists(std::string&& path) {
		if (!std::filesystem::exists(path))
			std::filesystem::create_directory(path);
	}
}