#pragma once


#include "folder_manager.hpp"
#include "../internal.hpp"
#include "folder_manager.hpp"
#include "../fals/mime_converter.hpp"


class Folder {
	std::string get_this_storage() const {
		std::string res;
		res += "storage/folders/";
		res += name_;

		return res;
	}


public:
	std::string name_;

	Folder(std::string&& name)
		: name_(name) {

		fals::mkdir_if_not_exists(get_this_storage());

		Folder::get_folders().push_back(this);
	}


	static std::vector<Folder*>& get_folders() {
		static std::vector<Folder* > folders;

		return folders;
	}


	std::shared_ptr<server_response> add_attachment(req request) {
		auto attachment = request->get_form_by_key("attachment");
		if (attachment.empty() || request->files.size() != 1)
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		std::string extension = get_extension(request->files[0].type);
		int res = folder_manager::add_file(name_, std::move(attachment.value), std::move(extension), std::move(request->files[0].data));

		return text_resp(request->socket, res ? 200 : 503, "OK", "text/plain", res ? "OK" : "Server Error");
	}


	std::shared_ptr<server_response> delete_attachment(req request) {
		auto attachment = request->get_form_by_key("attachment");
		if (attachment.empty())
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		bool res = folder_manager::delete_file(name_, std::move(attachment.value));

		return text_resp(request->socket, res ? 200 : 503, "OK", "text/plain", res ? "OK" : "Server Error");
	}


	std::shared_ptr<server_response> get_attachment(req request) {
		if (!request->query.contains("attachment"))
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		std::filesystem::path file = folder_manager::get_file(name_, std::move(request->query["attachment"]));
		if (file.empty())
			return text_resp();

		std::string mime = get_mime(file.extension().string());

		return file_resp(request->socket, 200, "OK", mime, file.string(), file.filename().string(), OpenType::ATTACHMENT);
	}


	std::shared_ptr<server_response> get_list(req request) {
		nlohmann::json js = folder_manager::get_files(name_);

		return text_resp(request->socket, 200, "OK", "application/json", js.dump());
	}
};