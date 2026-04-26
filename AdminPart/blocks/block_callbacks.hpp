#pragma once


#include <unordered_map>
#include "block_manager.hpp"
#include "../fals/main_server.hpp"
#include "../fals/mime_converter.hpp"
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
	std::vector<std::string> type_;
	std::string desc_;

	file_require(std::string&& name, std::vector<std::string>&& type, std::string&& desc)
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
		nlohmann::json js;

		nlohmann::json arr = nlohmann::json::array();
		for (auto& field : json_requires_) {
			nlohmann::json obj;
			obj["sysname"] = field.name_;
			obj["type"] = JSON_MAP.at(field.type_);
			obj["description"] = field.desc_;

			arr.push_back(obj);
		}
		js["json"] = arr;

		arr.clear();
		for (auto& file : file_requires_) {
			nlohmann::json obj;
			obj["sysname"] = file.name_;
			obj["type"] = file.type_;
			obj["description"] = file.desc_;

			arr.push_back(obj);
		}
		js["file"] = arr;

		return text_resp(request->socket, 200, "OK", "application/json", js.dump());
	}


	std::shared_ptr<server_response> get_content(req request) {
		if (!request->query.contains("name"))
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		nlohmann::json content = block_manager::get_content(name_, std::move(request->query["name"]));
		if (content.empty())
			return text_resp();

		return text_resp(request->socket, 200, "OK", "application/json", content.dump());
	}


	std::shared_ptr<server_response> get_attachment(req request) {
		if (!request->query.contains("attachment") || !request->query.contains("name"))
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		auto file_req = std::find_if(file_requires_.begin(), file_requires_.end(), [&](file_require f) { return f.name_ == request->query["attachment"]; });
		if (file_req == file_requires_.end())
			return text_resp();

		std::filesystem::path file = block_manager::get_attachment(name_, std::move(request->query["name"]), std::move(request->query["attachment"]));
		if (file.empty())
			return text_resp();

		std::string mime = get_mime(file.extension().string());

		bool any_file = file_req->type_.size() == 1 && file_req->type_[0] == "*";
		if (!any_file && std::find(file_req->type_.begin(), file_req->type_.end(), mime) == file_req->type_.end())
			return text_resp();

		return file_resp(request->socket, 200, "OK", mime, file.string(), file.filename().string(), OpenType::INLINE);
	}


	std::shared_ptr<server_response> get_active_attachments(req request) {
		if (!request->query.contains("name"))
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		std::vector<std::string> whitelist;
		for (file_require& f : file_requires_)
			whitelist.push_back(f.name_);

		nlohmann::json actives = block_manager::get_actives(name_, std::move(request->query["name"]), std::move(whitelist));

		return text_resp(request->socket, 200, "OK", "application/json", actives.dump());
	}


	std::shared_ptr<server_response> set_content(req request) {
		auto data = request->get_form_by_key("data");
		auto name = request->get_form_by_key("name");
		if (data.empty() || name.empty())
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		try {
			nlohmann::json js = nlohmann::json::parse(data.value);
			bool res = block_manager::set_content(name_, std::move(name.value), std::move(js));

			return text_resp(request->socket, res ? 200 : 503, "OK", "text/plain", res ? "OK" : "Server Error");
		}
		catch (...) {
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");
		}
	}


	std::shared_ptr<server_response> add_attachment(req request) {
		auto name = request->get_form_by_key("name");
		auto attachment = request->get_form_by_key("attachment");
		if (name.empty() || attachment.empty() || request->files.size() != 1)
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		auto file_req = std::find_if(file_requires_.begin(), file_requires_.end(), [&](file_require f) { return f.name_ == attachment.value; });
		if (file_req == file_requires_.end())
			return text_resp();

		bool any_file = file_req->type_.size() == 1 && file_req->type_[0] == "*";
		if (!any_file && std::find(file_req->type_.begin(), file_req->type_.end(), request->files[0].type) == file_req->type_.end())
			return text_resp();

		std::string extension = get_extension(request->files[0].type);
		int res = block_manager::add_attachment(name_, std::move(name.value), std::move(attachment.value), std::move(extension), std::move(request->files[0].data));

		return text_resp(request->socket, res ? 200 : 503, "OK", "text/plain", res ? "OK" : "Server Error");
	}


	std::shared_ptr<server_response> delete_attachment(req request) {
		auto name = request->get_form_by_key("name");
		auto attachment = request->get_form_by_key("attachment");
		if (name.empty() || attachment.empty() || attachment.value == "content")
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		auto file_req = std::find_if(file_requires_.begin(), file_requires_.end(), [&](file_require f) { return f.name_ == attachment.value; });
		if (file_req == file_requires_.end())
			return text_resp();

		bool res = block_manager::delete_attachment(name_, std::move(name.value), std::move(attachment.value));

		return text_resp(request->socket, res ? 200 : 503, "OK", "text/plain", res ? "OK" : "Server Error");
	}


	std::shared_ptr<server_response> get_order(req request) {
		nlohmann::json visible = block_manager::get_order(name_);

		if (!request->query.contains("secret") || !fals_GLOBAL::is_secret(std::move(request->query["secret"])))
			return std::make_shared<text_response>(request->socket, 200, "OK", "application/json", visible.dump());

		nlohmann::json all = block_manager::get_all(name_);

		for (std::string v : visible) {
			all.erase(
				std::remove(all.begin(), all.end(), nlohmann::json(v)),
				all.end()
			);
		}

		nlohmann::json js;
		js["visible"] = visible;
		js["invisible"] = all;

		return std::make_shared<text_response>(request->socket, 200, "OK", "application/json", js.dump());
	}


	std::shared_ptr<server_response> set_order(req request) {
		auto data = request->get_form_by_key("data");
		if (data.empty())
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		try {
			nlohmann::json js = nlohmann::json::parse(data.value);
			bool res = block_manager::set_order(name_, std::move(js));

			return text_resp(request->socket, res ? 200 : 503, "OK", "text/plain", res ? "OK" : "Server Error");
		}
		catch (...) {
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");
		}
	}


	std::shared_ptr<server_response> create(req request) {
		auto name = request->get_form_by_key("name");
		if (name.empty())
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		int res = block_manager::create(name_, std::move(name.value));

		return text_resp(request->socket, res ? 200 : 503, "OK", "text/plain", res ? "OK" : "Server Error");
	}


	std::shared_ptr<server_response> remove(req request) {
		auto name = request->get_form_by_key("name");
		if (name.empty())
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		int res = block_manager::remove(name_, std::move(name.value));

		return text_resp(request->socket, res ? 200 : 503, "OK", "text/plain", res ? "OK" : "Server Error");
	}
};