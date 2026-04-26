#pragma once

#include <map>
#include <string>

#include <boost/asio.hpp>
#include <boost/algorithm/string.hpp>

#include <unordered_map>
#include <iostream>

using boost::asio::ip::tcp;


#define req std::shared_ptr<server_request>


class multipart_parser {
public:
    struct file {
        std::string name;
        std::string type;
        std::vector<char> data;
        std::map<std::string, std::string> headers;
    };

    struct form {
        std::string name;
        std::string value;
        std::map<std::string, std::string> headers;
        
        bool empty() { return name.empty(); }
    };

    multipart_parser(const std::string &type, const std::string &body)
        : body(body) {
        size_t boundary_point = type.find("boundary=");
        if (boundary_point != std::string::npos) {
            this->boundary = type.substr(boundary_point + 9);
            boost::trim(this->boundary);
            if (this->boundary.front() == '"' && this->boundary.back() == '"') {
                boundary = boundary.substr(1, boundary.size() - 2);
            }
        }
    }

    std::vector<form> parse_forms() {
        std::vector<form> forms;
        parse_parts([&forms, this](std::string part) {
            form form;
            if (this->parse_form(part, form)) {
                forms.push_back(std::move(form));
            }
            });
        return forms;
    }

    std::vector<file> parse_files() {
        std::vector<file> files;
        parse_parts([&files, this](std::string part) {
            file file;
            if (this->parse_file(part, file)) {
                files.push_back(std::move(file));
            }
            });
        return files;
    }

private:
    std::string boundary;
    const std::string& body;

    template<typename F>
    void parse_parts(F&& callback) {
        std::string del = "--" + boundary;
        size_t pos = 0;
        size_t start = 0;

        while ((pos = body.find(del, start)) != std::string::npos) {
            if (pos > start) {
                std::string part = body.substr(start, pos - start);

                if (!part.empty()) {
                    if (part.size() >= 2 && part[0] == '\r' && part[1] == '\n') {
                        part = part.substr(2);
                    }

                    if (!part.empty()) {
                        callback(std::move(part));
                    }
                }
            }

            start = pos + del.length();

            if (body.compare(start, 2, "--") == 0) {
                break;
            }
        }
    }

    bool parse_form(const std::string_view& part, form& form) {
        size_t header_end = part.find("\r\n\r\n");
        if (header_end == std::string::npos) return false;
        
        std::string_view headers_str = part.substr(0, header_end);
        std::string_view content = part.substr(header_end + 4);

        if (content.size() >= 2 && content[content.size() - 2] == '\r' && content[content.size() - 1] == '\n') {
            content.remove_suffix(2);
        }
        
        std::string headers_copy(headers_str);
        std::vector<std::string> header_lines;
        boost::split(header_lines, headers_copy, boost::is_any_of("\r\n"));
        
        for (const std::string &line : header_lines) {
            if (line.empty()) continue;
            
            size_t col_pos = line.find(':');
            if (col_pos != std::string::npos) {
                std::string key = line.substr(0, col_pos);
                std::string value = line.substr(col_pos + 1);
                boost::trim(key);
                boost::trim(value);
                form.headers[key] = value;
            }
            
            if (line.find("Content-Disposition:") != std::string::npos) {
                size_t name_pos = line.find("name=\"");
                if (name_pos != std::string::npos) {
                    size_t name_end = line.find("\"", name_pos + 6);
                    if (name_end != std::string::npos) {
                        form.name = line.substr(name_pos + 6, name_end - name_pos - 6);
                    }
                }
            }
        }
        
        form.value = std::string(content);
        return !form.name.empty();
    }
    
    bool parse_file(const std::string_view& part, file& file) {
        size_t header_end = part.find("\r\n\r\n");
        if (header_end == std::string::npos) return false;
        
        std::string_view headers_str = part.substr(0, header_end);
        std::string_view content = part.substr(header_end + 4);

        if (content.size() >= 2 && content[content.size() - 2] == '\r' && content[content.size() - 1] == '\n') {
            content.remove_suffix(2);
        }
        
        std::string headers_copy(headers_str);
        std::vector<std::string> header_lines;
        boost::split(header_lines, headers_copy, boost::is_any_of("\r\n"));
        
        bool is_file = false;
        
        for (const std::string &line : header_lines) {
            if (line.empty()) continue;
            
            size_t col_pos = line.find(':');
            if (col_pos != std::string::npos) {
                std::string key = line.substr(0, col_pos);
                std::string value = line.substr(col_pos + 1);
                boost::trim(key);
                boost::trim(value);
                file.headers[key] = value;
            }
            
            if (line.find("Content-Disposition:") != std::string::npos) {
                size_t filename_pos = line.find("filename=\"");
                if (filename_pos != std::string::npos) {
                    is_file = true;
                    size_t filename_end = line.find("\"", filename_pos + 10);
                    if (filename_end != std::string::npos) {
                        file.name = line.substr(filename_pos + 10, filename_end - filename_pos - 10);
                    }
                }
            }
            
            if (line.find("Content-Type:") != std::string::npos) {
                size_t type_pos = line.find(":");
                file.type = line.substr(type_pos + 1);
                boost::trim(file.type);
            }
        }
        
        if (is_file && !file.name.empty()) {
            file.data.assign(content.begin(), content.end());
            return true;
        }
        
        return false;
    }
};



class param_parser {
public:
	static std::unordered_map<std::string, std::string> parse ( const std::string &string ) {
		std::unordered_map<std::string, std::string> res;
		size_t start = 0;

		while ( start < string.size ( ) ) {
			size_t end = string.find ( '&', start );

			if ( end == std::string::npos ) end = string.size ( );

			size_t equal = string.find ( '=', start );

			if ( equal != std::string::npos && equal < end ) {
				std::string key = decode ( string.substr ( start, equal - start ) );
				std::string value = decode ( string.substr ( equal + 1, end - equal - 1 ) );

				res [std::move ( key )] = std::move ( value );
			}

			start = end + 1;
		}

		return res;
	}


	static std::string decode ( const std::string &encoded ) {
		std::string result;
		result.reserve ( encoded.size ( ) );

		for ( size_t i = 0; i < encoded.size ( ); ++i ) {
			if ( encoded [i] == '%' && i + 2 < encoded.size ( ) ) {
				char hex [3] = { encoded [i + 1], encoded [i + 2], 0 };
				char *endptr;
				long val = strtol ( hex, &endptr, 16 );
				if ( endptr == hex + 2 ) {
					result += static_cast<char>( val );
					i += 2;
				}
				else {
					result += '%';
				}
			}
			else if ( encoded [i] == '+' ) {
				result += ' ';
			}
			else {
				result += encoded [i];
			}
		}

		return result;
	}
};



class api_parser {
public:
	static std::vector<std::string> parse ( const std::string &api ) {
		std::vector<std::string> res;

		if ( api.front ( ) != '/' ) return res;

		size_t start = 0;
		size_t end = 1;
		std::string del;

		while ( ( start = api.find ( '/', end ) ) != std::string::npos ) {
			del = api.substr ( end, start - end );

			res.push_back ( param_parser::decode(del) );

			end = start + 1;
		}

		del = api.substr ( end, api.size ( ) - end );

		res.push_back ( param_parser::decode(del) );

		return res;
	}
};


class server_request {
public:
	std::shared_ptr<tcp::socket> socket;
	std::string method;
	std::vector<std::string> api;
	std::unordered_map<std::string, std::string> headers;
	std::unordered_map<std::string, std::string> query;
	std::vector<multipart_parser::form> forms;
	std::vector<multipart_parser::file> files;


	server_request ( std::shared_ptr<tcp::socket> socket, const std::string &api, std::string query )
		: socket ( socket ), query ( param_parser::parse ( query ) ), api ( api_parser::parse ( api ) ) {
	}


	multipart_parser::form get_form_by_key ( std::string key ) {
		auto data = std::find_if ( this->forms.begin ( ), this->forms.end ( ), [&key]( const multipart_parser::form &f ) {
			return f.name == key;
		} );

		if ( data != this->forms.end ( ) ) {
			return *data;
		}

		return multipart_parser::form { };
	}


	~server_request ( ) = default;
};