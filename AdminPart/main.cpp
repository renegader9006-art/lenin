#include <iostream>
#include <string>
#include "fals/main_server.hpp"
#include "locales/locale_controller.hpp"
#include "global/admin_controller.hpp"
#include "blocks/block_controller.hpp"
#include "folders/folder_controller.hpp"
#include <openssl/sha.h>


#define IMAGE_MIMES { "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/bmp", "image/tiff", "image/x-icon", "image/vnd.microsoft.icon", "image/heic", "image/heif", "image/avif", "image/apng" }


int main() {
	MainServer serv{ 8080, 4 };

	fals_LOCALE::init();
	fals_BLOCK::init();
	fals_GLOBAL::init();
	fals_FOLDER::init();

    
    Locale main_locale{ 
        "\u0433\u043b\u0430\u0432\u043d\u0430\u044f", 
        {
            "\u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435", 
            "\u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435", 
            "\u043f\u043e\u0434\u0440\u043e\u0431\u043d\u0435\u0435", 
            "\u043f\u043e\u043b\u043d\u043e\u0435"
        } 
    };

	Locale derec_locale{ 
        "\u0434\u0438\u0440\u0435\u043a\u0446\u0438\u044f", 
        {
            "\u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435", 
            "\u0444\u0438\u043e", 
            "\u0437\u0430\u0441\u043b\u0443\u0433\u0438", 
            "\u043e\u0431\u0440\u0430\u0437\u043e\u0432\u0430\u043d\u0438\u0435",
            "\u043e\u043f\u044b\u0442",
            "\u0444\u0430\u043a\u0442\u044b",
            "\u043a\u043e\u043b\u043b\u0435\u043a\u0442\u0438\u0432",
            "\u0446\u0435\u043b\u0438",
            "\u0437\u0430\u0434\u0430\u0447\u0438"
        } 
    };


    Locale party_locale{ 
        "\u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u0438", 
        {
            "\u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435"
        } 
    };


    Locale contacts{
        "\u043a\u043e\u043d\u0442\u0430\u043a\u0442\u044b",
        {
            "\u0430\u0434\u0440\u0435\u0441",
            "\u0442\u0435\u043b\u0435\u0444\u043e\u043d",
            "\u043f\u043e\u0447\u0442\u0430",
            "\u0442\u0435\u043b\u0435\u0433\u0440\u0430\u043c"
        }
    };
	
    Block team_block {
        "\u043A\u043E\u043C\u0430\u043D\u0434\u0430",
        {
            { "fullname", types::STR, "\u0424\u0418\u041E" },
            { "post", types::STR, "\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C" },
            { "number", types::STR, "\u0422\u0435\u043B\u0435\u0444\u043E\u043D" },
            { "email", types::STR, "\u041F\u043E\u0447\u0442\u0430" }
        },
        {
            { "photo", IMAGE_MIMES, "\u0424\u043E\u0442\u043E" }
        }
    };


    Block metro_block {
        "\u043C\u0435\u0442\u0440\u043E",
        {
            { "name", types::STR, "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435" },
            { "short_desc", types::STR, "\u041A\u0440\u0430\u0442\u043A\u043E\u0435 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" },

            { "full_desc_one", types::STR, "\u041F\u043E\u043B\u043D\u043E\u0435 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" },
            { "full_desc_two", types::STR, "\u0414\u043E\u043F. \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" },

            { "scheme_desc", types::STR, "\u0421\u0445\u0435\u043C\u0430" },

            { "modern_desc", types::STR, "\u041C\u043E\u0434\u0435\u0440\u043D\u0438\u0437\u0430\u0446\u0438\u044F" },

            { "struct_desc", types::STR, "\u0418\u043D\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430" },

            { "partnership_desc", types::STR, "\u041F\u0430\u0440\u0442\u043D\u0435\u0440\u0441\u0442\u0432\u043E" },

            { "safety_desc", types::STR, "\u0411\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u044C" },

            { "acessable_desc", types::STR, "\u0414\u043E\u0441\u0442\u0443\u043F\u043D\u043E\u0441\u0442\u044C" }
        },
        {
            { "logo", IMAGE_MIMES, "\u041B\u043E\u0433\u043E\u0442\u0438\u043F" },

            { "desc_one", IMAGE_MIMES, "\u041F\u043E\u043B\u043D\u043E\u0435 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" },

            { "desc_two", IMAGE_MIMES, "\u0414\u043E\u043F. \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" },

            { "scheme", IMAGE_MIMES, "\u0421\u0445\u0435\u043C\u0430" },

            { "modern", IMAGE_MIMES, "\u041C\u043E\u0434\u0435\u0440\u043D\u0438\u0437\u0430\u0446\u0438\u044F" },

            { "struct", IMAGE_MIMES, "\u0418\u043D\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430" },

            { "partnership", IMAGE_MIMES, "\u041F\u0430\u0440\u0442\u043D\u0435\u0440\u0441\u0442\u0432\u043E" },
        }
    };

    
    Block factories_block {
        "\u043F\u0440\u0435\u0434\u043F\u0440\u0438\u044F\u0442\u0438\u044F",
        {
            { "name", types::STR, "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435" },
            { "short_desc", types::STR, "\u041A\u0440\u0430\u0442\u043A\u043E\u0435 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" },

            { "full_desc_one", types::STR, "\u041F\u043E\u043B\u043D\u043E\u0435 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" },
            { "full_desc_two", types::STR, "\u0414\u043E\u043F. \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" },

            { "spec_desc", types::STR, "\u0421\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F" },

            { "struct_desc", types::STR, "\u0418\u043D\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430" },

            { "quality", types::STR, "\u043A\u0430\u0447\u0435\u0441\u0442\u0432\u043E" },

            { "contact", types::STR, "\u043A\u043E\u043D\u0442\u0430\u043A\u0442\u044B" }
        },
        {
            { "logo", IMAGE_MIMES, "\u041B\u043E\u0433\u043E\u0442\u0438\u043F" },

            { "desc_one", IMAGE_MIMES, "\u041F\u043E\u043B\u043D\u043E\u0435 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" },

            { "desc_two", IMAGE_MIMES, "\u0414\u043E\u043F. \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" },

            { "spec", IMAGE_MIMES, "\u041F\u043E\u043B\u043D\u043E\u0435 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" },

            { "struct", IMAGE_MIMES, "\u0418\u043D\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430" }
        }
    };


    Block comittete_block {
        "\u043a\u043e\u043c\u0438\u0442\u0435\u0442",
        {
            { "name", types::STR, "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435" },
            { "short_desc", types::STR, "\u041A\u0440\u0430\u0442\u043A\u043E\u0435 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" },

            { "full_desc_one", types::STR, "\u041F\u043E\u043B\u043D\u043E\u0435 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" },
            { "full_desc_two", types::STR, "\u0414\u043E\u043F. \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" },

            { "specs_desc", types::STR, "\u043e\u0441\u043e\u0431\u0435\u043d\u043d\u043e\u0441\u0442\u0438" },
            { "functions_desc", types::STR, "\u0444\u0443\u043d\u043a\u0446\u0438\u0438" }
        },
        {
            { "logo", IMAGE_MIMES, "\u041B\u043E\u0433\u043E\u0442\u0438\u043F" },

            { "desc_one", IMAGE_MIMES, "\u041F\u043E\u043B\u043D\u043E\u0435 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" },

            { "desc_two", IMAGE_MIMES, "\u0414\u043E\u043F. \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" }
        }
    };


    Block news_block {
        "\u043D\u043E\u0432\u043E\u0441\u0442\u0438",
        {
            { "header", types::STR, "\u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A" },
            { "body", types::STR, "\u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0435" },
            { "date", types::DATE, "\u0434\u0430\u0442\u0430" }
    },
        {
            { "mini", IMAGE_MIMES, "\u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440" },
            { "full", IMAGE_MIMES, "\u043F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435" },
        }
    };


    Block events_block {
        "\u043C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u044F",
        {
            { "header", types::STR, "\u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A" },
            { "body", types::STR, "\u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0435" },
            { "date", types::STR, "\u0432\u0440\u0435\u043C\u044F" }
        },
        {
        }
    };


    Folder charter_folder {
        "\u0443\u0441\u0442\u0430\u0432"
    };


    Folder professions {
        "\u043f\u0440\u043e\u0444\u0435\u0441\u0441\u0438\u0438"
    };


    Folder protocols {
        "\u043f\u0440\u043e\u0442\u043e\u043a\u043e\u043b\u044b"
    };


    Folder knowledge {
        "\u0437\u043d\u0430\u043d\u0438\u044f"
    };


    Folder meetings {
        "\u0441\u043e\u0432\u0435\u0449\u0430\u043d\u0438\u044f"
    };


	//Локали
	serv.add_callback({ "GET", {"api","v1","locale"}, [](req request) {
		auto response = fals_LOCALE::process_get(request);

		response->headers["Access-Control-Allow-Origin"] = "*";
		response->headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
		response->headers["Access-Control-Allow-Headers"] = "Content-Type";
		response->headers["Access-Control-Max-Age"] = "86400";

		return response;
	} });

	serv.add_callback({ "POST", {"api","v1", "locale"}, [](req request) {
		return fals_LOCALE::process_post(request);
	} });


	//Блоки
	serv.add_callback({ "GET", {"api","v1","block"}, [](req request) {
		auto response = fals_BLOCK::process_get(request);

		response->headers["Access-Control-Allow-Origin"] = "*";
		response->headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
		response->headers["Access-Control-Allow-Headers"] = "Content-Type";
		response->headers["Access-Control-Max-Age"] = "86400";

		return response;
	} });

	serv.add_callback({ "POST", {"api","v1", "block"}, [](req request) {
		return fals_BLOCK::process_post(request);
	} });


	//Папки
	serv.add_callback({ "GET", {"api","v1","folder"}, [](req request) {
		auto response = fals_FOLDER::process_get(request);

		response->headers["Access-Control-Allow-Origin"] = "*";
		response->headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
		response->headers["Access-Control-Allow-Headers"] = "Content-Type";
		response->headers["Access-Control-Max-Age"] = "86400";

		return response;
	} });

	serv.add_callback({ "POST", {"api","v1", "folder"}, [](req request) {
		return fals_FOLDER::process_post(request);
	} });


	//Глобали
	serv.add_callback({ "POST", {"api", "v1", "secret"}, [](req request) {
		auto secret = request->get_form_by_key("secret");
		if (secret.empty() || !fals_GLOBAL::is_secret(std::move(secret.value)))
			return text_resp();

		auto new_secret = request->get_form_by_key("new");
		if (new_secret.empty())
			return text_resp(request->socket, 400, "Bad Request", "text/plain", "Bad Request");

		fals_GLOBAL::change_secret(fals_GLOBAL::hash_string(std::move(new_secret.value)));

		return text_resp(request->socket, 200, "OK", "text/plain", new_secret.value);
	} });


	//Странички
	serv.add_callback({ "GET", {""}, [](req request) {
		return file_resp(request->socket, 200, "OK", "text/html", "login.html", "page.html", OpenType::INLINE);
	} });

	serv.add_callback({ "GET", {"global.css"},[](req request) {
		return file_resp(request->socket, 200, "OK", "text/css", "global.css", "style.css", OpenType::INLINE);
	} });

	serv.add_callback({ "GET", {"admin"}, [](req request) {
		if (!request->query.contains("secret") || !fals_GLOBAL::is_secret(std::move(request->query["secret"])))
			return redirect_resp(request->socket, 301, "Temporaly Redirected", "/");

		return file_resp(request->socket, 200, "OK", "text/html", "admin.html", "page.html", OpenType::INLINE);
	} });

	serv.add_callback({ "POST", {"auth"}, [](req request) {
		auto secret = request->get_form_by_key("secret");
		if (secret.empty() || !fals_GLOBAL::is_secret(std::move(secret.value)))
			return text_resp(request->socket, 200, "OK", "text/plain", "failed");

		return text_resp(request->socket, 200, "OK", "text/plain", "confirmed");
	} });


	//Фигня для CORS-а
	serv.add_callback({ "OPTIONS", { }, [](std::shared_ptr<server_request> request) {
		auto response = std::make_shared<text_response>(request->socket, 200, "OK", "text/plain", "");

		response->headers["Access-Control-Allow-Origin"] = "*";
		response->headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
		response->headers["Access-Control-Allow-Headers"] = "Content-Type";
		response->headers["Access-Control-Max-Age"] = "86400";

		return response;
	} });


	while (true)
		continue;
}