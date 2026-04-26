#pragma once


#include <unordered_map>
#include <string>
#include <typeindex>
#include <fstream>
#include <nlohmann/json.hpp>
#include "../fals/main_server.hpp"
#include <filesystem>
#include "../global/admin_controller.hpp"


enum class types {
	STR, DATE, TIME, DATE_TIME, INT, BOOL, LIST
};
const std::unordered_map<types, std::string> JSON_MAP{
	{ types::STR, "str" },
	{ types::DATE, "date" },
	{ types::TIME, "time" },
	{ types::DATE_TIME, "date-time" },
	{ types::INT, "int" },
	{ types::BOOL, "bool" },
	{ types::LIST, "list" }
};


enum class files {
	PHOTO, TEXT, ALL
};
const std::unordered_map<files, std::vector<std::string>> FILE_MAP{
	{ files::PHOTO, {"image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"} },
	{ files::TEXT, {"text/plain", "text/html", "text/css", "text/javascript", "text/markdown"} },
	{ files::ALL, {"*"} }
};


const std::unordered_map<std::string, std::string> MIME_TO_EXTENSION = {
	// Text
	{ "text/plain", ".txt" },
	{ "text/html", ".html" },
	{ "text/css", ".css" },
	{ "text/javascript", ".js" },
	{ "text/markdown", ".md" },

	// Images
	{ "image/jpeg", ".jpg" },
	{ "image/png", ".png" },
	{ "image/gif", ".gif" },
	{ "image/webp", ".webp" },
	{ "image/svg+xml", ".svg" },

	// Audio
	{ "audio/mpeg", ".mp3" },
	{ "audio/ogg", ".ogg" },
	{ "audio/wav", ".wav" },
	{ "audio/webm", ".weba" },
	{ "audio/aac", ".aac" },
	{ "audio/midi", ".midi" },

	// Video
	{ "video/mp4", ".mp4" },
	{ "video/mpeg", ".mpeg" },
	{ "video/webm", ".webm" },
	{ "video/ogg", ".ogv" },
	{ "video/x-msvideo", ".avi" },
	{ "video/3gpp", ".3gp" },
	{ "video/3gpp2", ".3g2" },
	{ "video/mp2t", ".ts" },

	// Documents
	{ "application/pdf", ".pdf" },
	{ "application/msword", ".doc" },
	{ "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx" },
	{ "application/vnd.ms-excel", ".xls" },
	{ "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".xlsx" },
	{ "application/vnd.ms-powerpoint", ".ppt" },
	{ "application/vnd.openxmlformats-officedocument.presentationml.presentation", ".pptx" },
	{ "application/rtf", ".rtf" },
	{ "application/vnd.oasis.opendocument.text", ".odt" },
	{ "application/vnd.oasis.opendocument.spreadsheet", ".ods" },
	{ "application/vnd.oasis.opendocument.presentation", ".odp" },
	{ "application/epub+zip", ".epub" },

	// Archives
	{ "application/zip", ".zip" },
	{ "application/x-zip-compressed", ".zip" },
	{ "application/x-7z-compressed", ".7z" },
	{ "application/x-rar-compressed", ".rar" },
	{ "application/gzip", ".gz" },
	{ "application/x-tar", ".tar" },
	{ "application/x-bzip", ".bz" },
	{ "application/x-bzip2", ".bz2" },

	// Data formats
	{ "application/json", ".json" },
	{ "application/xml", ".xml" },
	{ "application/ld+json", ".jsonld" },
	{ "application/java-archive", ".jar" },
	{ "application/octet-stream", ".bin" },

	// Fonts
	{ "font/ttf", ".ttf" },
	{ "font/otf", ".otf" },
	{ "font/woff", ".woff" },
	{ "font/woff2", ".woff2" },

	// Other
	{ "application/xhtml+xml", ".xhtml" },
	{ "application/x-sh", ".sh" },
	{ "application/x-csh", ".csh" },
	{ "application/x-httpd-php", ".php" },
	{ "application/vnd.amazon.ebook", ".azw" },
	{ "application/x-freearc", ".arc" },
	{ "application/vnd.visio", ".vsd" },
	{ "application/x-abiword", ".abw" }
};
const std::unordered_map<std::string, std::string> EXTENSION_TO_MIME = {
	// Text
	{ ".txt", "text/plain" },
	{ ".html", "text/html" },
	{ ".css", "text/css" },
	{ ".js", "text/javascript" },
	{ ".md", "text/markdown" },

	// Images
	{ ".jpg", "image/jpeg" },
	{ ".jpeg", "image/jpeg" },
	{ ".png", "image/png" },
	{ ".gif", "image/gif" },
	{ ".webp", "image/webp" },
	{ ".svg", "image/svg+xml" },

	// Audio
	{ ".mp3", "audio/mpeg" },
	{ ".ogg", "audio/ogg" },
	{ ".wav", "audio/wav" },
	{ ".weba", "audio/webm" },
	{ ".aac", "audio/aac" },
	{ ".midi", "audio/midi" },
	{ ".mid", "audio/midi" },

	// Video
	{ ".mp4", "video/mp4" },
	{ ".mpeg", "video/mpeg" },
	{ ".mpg", "video/mpeg" },
	{ ".webm", "video/webm" },
	{ ".ogv", "video/ogg" },
	{ ".avi", "video/x-msvideo" },
	{ ".3gp", "video/3gpp" },
	{ ".3g2", "video/3g2" },
	{ ".ts", "video/mp2t" },

	// Documents
	{ ".pdf", "application/pdf" },
	{ ".doc", "application/msword" },
	{ ".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
	{ ".xls", "application/vnd.ms-excel" },
	{ ".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
	{ ".ppt", "application/vnd.ms-powerpoint" },
	{ ".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
	{ ".rtf", "application/rtf" },
	{ ".odt", "application/vnd.oasis.opendocument.text" },
	{ ".ods", "application/vnd.oasis.opendocument.spreadsheet" },
	{ ".odp", "application/vnd.oasis.opendocument.presentation" },
	{ ".epub", "application/epub+zip" },

	// Archives
	{ ".zip", "application/zip" },
	{ ".7z", "application/x-7z-compressed" },
	{ ".rar", "application/x-rar-compressed" },
	{ ".gz", "application/gzip" },
	{ ".tar", "application/x-tar" },
	{ ".bz", "application/x-bzip" },
	{ ".bz2", "application/x-bzip2" },

	// Data formats
	{ ".json", "application/json" },
	{ ".xml", "application/xml" },
	{ ".jsonld", "application/ld+json" },
	{ ".jar", "application/java-archive" },
	{ ".bin", "application/octet-stream" },

	// Fonts
	{ ".ttf", "font/ttf" },
	{ ".otf", "font/otf" },
	{ ".woff", "font/woff" },
	{ ".woff2", "font/woff2" },

	// Other
	{ ".xhtml", "application/xhtml+xml" },
	{ ".sh", "application/x-sh" },
	{ ".csh", "application/x-csh" },
	{ ".php", "application/x-httpd-php" },
	{ ".azw", "application/vnd.amazon.ebook" },
	{ ".arc", "application/x-freearc" },
	{ ".vsd", "application/vnd.visio" },
	{ ".abw", "application/x-abiword" }
};



class json_require {
public:
	std::string name_;
	types type_;
	std::string desc_;

	json_require(std::string&& name, types&& type, std::string&& desc)
		: type_(type), name_(name), desc_(desc) {
	}
};


class file_require {
public:
	std::string name_;
	files type_;
	std::string desc_;

	file_require(std::string&& name, files&& type, std::string&& desc)
		: type_(type), name_(name), desc_(desc) {
		if (name_ == "content") throw std::runtime_error("Name \"content\" aint supported");
	}
};


class Block {
	std::string get_this_storage() const {
		std::string res;
		res += "storage/blocks/";
		res += name_;

		return res;
	}


public:
	std::string name_;
	std::vector<json_require> json_requires_;
	std::vector<file_require> file_requires_;


	Block(std::string&& name, std::vector<json_require>&& json_requires, std::vector<file_require>&& file_requires)
		: name_(name), json_requires_(json_requires), file_requires_(file_requires) {

		fals::mkdir_if_not_exists(get_this_storage());

		Block::get_blocks().push_back(this);
	}


	static std::vector<Block*>& get_blocks() {
		static std::vector<Block* > blocks;

		return blocks;
	}


	std::shared_ptr<server_response> get_requires(req request) {
		nlohmann::json js = nlohmann::json::array();

		nlohmann::json arr = nlohmann::json::array();
		for (auto field : json_requires_) {
			nlohmann::json obj;
			obj["sysname"] = field.name_;
			obj["type"] = JSON_MAP.at(field.type_);
			obj["description"] = field.desc_;

			arr.push_back(obj);
		}
		js.push_back(arr);

		arr.clear();
		for (auto file : file_requires_) {
			nlohmann::json obj;
			obj["sysname"] = file.name_;
			obj["type"] = FILE_MAP.at(file.type_);
			obj["description"] = file.desc_;

			arr.push_back(obj);
		}	
		js.push_back(arr);

		return text_resp(request->socket, 200, "OK", "application/json", js.dump());
	}


	std::shared_ptr<server_response> get_content(req request) {
		if (!request->query.contains("name"))
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		std::string path = get_this_storage() + '/' + request->query["name"] + "/content.json";

		if (!std::filesystem::exists(path))
			return text_resp();

		return file_resp(request->socket, 200, "OK", "application/json", path, "data.json", OpenType::INLINE);
	}


	std::shared_ptr<server_response> get_attachment(req request) {
		if (!request->query.contains("attachment"))
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		if (!request->query.contains("name"))
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		std::string attachment = request->query["attachment"];

		auto file_req = std::find_if(file_requires_.begin(), file_requires_.end(), [&](file_require f) { return f.name_ == attachment; });
		if (file_req == file_requires_.end())
			return text_resp();

		std::string path = get_this_storage() + '/' + request->query["name"];
		for (const auto& entry : std::filesystem::directory_iterator(path)) {
			if (entry.is_regular_file()) {
				if (entry.path().stem().string() == attachment) {
					auto whitelist = FILE_MAP.at(file_req->type_);
					std::string mime = EXTENSION_TO_MIME.at(entry.path().extension().string());

					if (std::find(whitelist.begin(), whitelist.end(), mime) != whitelist.end())
						return file_resp(request->socket, 200, "OK", mime, entry.path().string(), entry.path().filename().string(), OpenType::INLINE);
				}
			}
		}

		return text_resp();
	}


	std::shared_ptr<server_response> get_active_attachments(req request) {
		if (!request->query.contains("name"))
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		nlohmann::json arr = nlohmann::json::array();

		std::string path = get_this_storage() + '/' + request->query["name"];
		for (const auto& entry : std::filesystem::directory_iterator(path)) {
			if (entry.is_regular_file()) {
				if (std::find_if(file_requires_.begin(), file_requires_.end(), [&](file_require f) { return f.name_ == entry.path().stem(); }) != file_requires_.end())
					arr.push_back(entry.path().stem().string());
			}
		}

		return text_resp(request->socket, 200, "OK", "application/json", arr.dump());
	}


	std::shared_ptr<server_response> set_content(req request) {
		auto data = request->get_form_by_key("data");
		if (data.empty())
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		auto name = request->get_form_by_key("name");
		if (name.empty())
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		std::string path = get_this_storage() + '/' + name.value + "/content.json";
		std::ofstream ofile{ path };
		if (!ofile.is_open())
			return text_resp();

		ofile << data.value;

		return text_resp(request->socket, 200, "OK", "text/plain", "OK");
	}


	std::shared_ptr<server_response> set_attachment(req request) {
		auto attachment = request->get_form_by_key("attachment");
		if (attachment.empty())
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		auto name = request->get_form_by_key("name");
		if (name.empty())
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		if (request->files.size() != 1)
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		auto file_req = std::find_if(file_requires_.begin(), file_requires_.end(), [&](file_require f) { return f.name_ == attachment.value; });
		if (file_req == file_requires_.end())
			return text_resp();

		auto whitelist = FILE_MAP.at(file_req->type_);
		if (file_req->type_ != files::ALL && std::find(whitelist.begin(), whitelist.end(), request->files[0].type) == whitelist.end())
			return text_resp();

		{
			delete_attachment(request);
		}

		std::string path = get_this_storage() + '/' + name.value + '/' + attachment.value + MIME_TO_EXTENSION.at(request->files[0].type);
		std::ofstream file{ path, std::ios::binary };
		if (!file.is_open())
			return text_resp();

		file.write(reinterpret_cast<const char*>(request->files[0].data.data()), request->files[0].data.size());

		return text_resp(request->socket, 200, "OK", "text/plain", "OK");
	}


	std::shared_ptr<server_response> delete_attachment(req request) {
		auto attachment = request->get_form_by_key("attachment");
		if (attachment.empty() || attachment.value == "content")
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		auto name = request->get_form_by_key("name");
		if (name.empty())
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		auto file_req = std::find_if(file_requires_.begin(), file_requires_.end(), [&](file_require f) { return f.name_ == attachment.value; });
		if (file_req == file_requires_.end())
			return text_resp();

		std::string path = get_this_storage() + '/' + name.value;
		for (const auto& entry : std::filesystem::directory_iterator(path)) {
			if (entry.is_regular_file()) {
				if (entry.path().stem() == attachment.value) {
					std::filesystem::remove(entry.path());
					return text_resp(request->socket, 200, "OK", "text/plain", "OK");
				}
			}
		}

		return text_resp();
	}


	std::shared_ptr<server_response> get_order(req request) {
		std::string path = get_this_storage();
		if (!std::filesystem::exists(path))
			return text_resp();

		bool moder_view = request->query.contains("secret") && request->query["secret"] == fals_GLOBAL::secret;

		std::ifstream file{ path + "/order.json" };
		nlohmann::json order_data = file.is_open() ? nlohmann::json::parse(file) : nlohmann::json::array();

		if (!moder_view) {
			return text_resp(request->socket, 200, "OK", "application/json", order_data.dump());
		}

		std::vector<std::string> folders;

		for (const auto& entry : std::filesystem::directory_iterator(path)) {
			std::string filename = entry.path().filename().string();
			if (entry.is_directory() && std::find(order_data.begin(), order_data.end(), filename) == order_data.end())
				folders.push_back(filename);
		}

		nlohmann::json js;
		js["visible"] = order_data;
		js["invisible"] = folders;

		return std::make_shared<text_response>(request->socket, 200, "OK", "application/json", js.dump());
	}


	std::shared_ptr<server_response> set_order(req request) {
		auto data = request->get_form_by_key("data");
		if (data.empty())
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		std::string path = get_this_storage();
		std::ofstream file{ path + '/' + "order.json" };
		if (!file.is_open())
			return text_resp();

		file << data.value;

		return text_resp(request->socket, 200, "OK", "application/json", "OK");
	}


	std::shared_ptr<server_response> create(req request) {
		auto name = request->get_form_by_key("name");
		if (name.empty())
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		std::string path = get_this_storage() + '/' + name.value;
		std::filesystem::create_directory(path);

		return text_resp(request->socket, 200, "OK", "text/plain", "OK");
	}


	std::shared_ptr<server_response> remove(req request) {
		auto name = request->get_form_by_key("name");
		if (name.empty())
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		std::string path = get_this_storage() + '/' + name.value;
		std::filesystem::remove_all(path);

		nlohmann::json js;
		std::string order = get_this_storage() + '/' + "order.json";

		{
			std::ifstream ofile{ order };

			js = ofile.is_open() ? nlohmann::json::parse(ofile) : nlohmann::json::array();
			js.erase(
				std::remove(js.begin(), js.end(), nlohmann::json(name.value)),
				js.end()
			);
		}

		std::ofstream ifile{ order };
		if (!ifile.is_open())
			return text_resp();

		ifile << js.dump();

		return text_resp(request->socket, 200, "OK", "text/plain", "OK");
	}
};