#pragma once


#include "../fals/server_request.hpp"
#include "../fals/server_response.hpp"
#include "folder_callbacks.hpp"
#include "../global/admin_controller.hpp"


class fals_FOLDER {
public:
	static std::shared_ptr<server_response> process_get(req request) {
		if (request->api.size() == 4 && request->api[3] == "list") {
			if (!request->query.contains("secret") || !fals_GLOBAL::is_secret(std::move(request->query["secret"])))
				return text_resp();

			auto folders = Folder::get_folders();

			std::vector <std::string> names;
			for (auto folder : folders) {
				names.push_back(folder->name_);
			}

			nlohmann::json js = names;
			return text_resp(request->socket, 200, "OK", "text/plain", js.dump());
		}
		else if (request->api.size() == 5) {
			auto folders = Folder::get_folders();
			auto folder = std::find_if(folders.begin(), folders.end(), [&](Folder* folder) { return folder->name_ == request->api[3]; });

			if (folder == folders.end())
				return text_resp();

			if (request->api[4] == "get")
				return (*folder)->get_attachment(request);

			else if (request->api[4] == "list")
				return (*folder)->get_list(request);
		}

		return text_resp();
	}


	static std::shared_ptr<server_response> process_post(req request) {
		auto secret = request->get_form_by_key("secret");
		if (secret.empty() || !fals_GLOBAL::is_secret(std::move(secret.value)))
			return text_resp();


		if (request->api.size() == 5) {
			auto folders = Folder::get_folders();
			auto folder = std::find_if(folders.begin(), folders.end(), [&](Folder* folder) { return folder->name_ == request->api[3]; });

			if (folder == folders.end())
				return text_resp();

			if (request->api[4] == "add")
				return (*folder)->add_attachment(request);

			else if (request->api[4] == "remove")
				return (*folder)->delete_attachment(request);
		}

		return text_resp();
	}



	static void init() {
		fals::mkdir_if_not_exists("storage");
		fals::mkdir_if_not_exists("storage/folders");
	}
};