#pragma once


#include "../fals/server_request.hpp"
#include "../fals/server_response.hpp"
#include "block_callbacks.hpp"


class fals_BLOCK {
public:
	static std::shared_ptr<server_response> process_get(req request) {
		if (request->api.size() == 4 && request->api[3] == "list") {
			if (!request->query.contains("secret") || !fals_GLOBAL::is_secret(std::move(request->query["secret"])))
				return text_resp();

			auto blocks = Block::get_blocks();

			std::vector <std::string> names;
			for (auto block : blocks) {
				names.push_back(block->name_);
			}

			nlohmann::json js = names;
			return text_resp(request->socket, 200, "OK", "text/plain", js.dump());
		}
		else if (request->api.size() == 5) {
			auto blocks = Block::get_blocks();
			auto block = std::find_if(blocks.begin(), blocks.end(), [&](Block* block) { return block->name_ == request->api[3]; });

			if (block == blocks.end())
				return text_resp();

			if (request->api[4] == "requires")
				return (*block)->get_requires(request);

			else if (request->api[4] == "attachments")
				return (*block)->get_active_attachments(request);

			else if (request->api[4] == "content")
				return (*block)->get_content(request);

			else if (request->api[4] == "attachment")
				return (*block)->get_attachment(request);

			else if (request->api[4] == "order")
				return (*block)->get_order(request);
		}

		return text_resp();
	}


	static std::shared_ptr<server_response> process_post(req request) {
		auto secret = request->get_form_by_key("secret");
		if (secret.empty() || !fals_GLOBAL::is_secret(std::move(secret.value)))
			return text_resp();


		if (request->api.size() == 5) {
			auto blocks = Block::get_blocks();
			auto block = std::find_if(blocks.begin(), blocks.end(), [&](Block* block) { return block->name_ == request->api[3]; });

			if (block == blocks.end())
				return text_resp();

			if (request->api[4] == "content")
				return (*block)->set_content(request);

			else if (request->api[4] == "attach")
				return (*block)->add_attachment(request);

			else if (request->api[4] == "detach")
				return (*block)->delete_attachment(request);

			else if (request->api[4] == "order")
				return (*block)->set_order(request);

			else if (request->api[4] == "create")
				return (*block)->create(request);

			else if (request->api[4] == "remove")
				return (*block)->remove(request);
		}

		return text_resp();
	}



	static void init() {
		fals::mkdir_if_not_exists("storage");
		fals::mkdir_if_not_exists("storage/blocks");
	}
};