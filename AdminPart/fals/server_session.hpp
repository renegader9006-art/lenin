#pragma once



#include "server_request.hpp"
#include "server_response.hpp"
#include <boost/algorithm/string.hpp>

#include <functional>
#include <iostream>

#include <chrono>


using callback_func = std::function<std::shared_ptr<server_response> ( std::shared_ptr<server_request> )>;



class callback_method {
public:
	std::string rest_;
	std::vector<std::string> path_;
	callback_func callback_;


	callback_method ( std::string &&rest, std::vector<std::string> &&path, callback_func &&callback )
		: rest_ ( rest ), path_ ( path ), callback_ ( callback ) { }


	bool starts_with ( std::string rest, std::vector<std::string> path ) const {
		if ( rest_ != rest || path.size ( ) < path_.size ( ) ) return false;

		for ( size_t i = 0; i < path_.size ( ); i++ ) {
			if ( path_ [i] != path [i] ) return false;
		}

		return true;
	}
};



class Session : public std::enable_shared_from_this<Session> {
public:
	Session ( tcp::socket socket, std::vector<callback_method> &methods )
		: socket_ ( std::move ( socket ) ), methods_ ( methods ) {

		boost::asio::ip::tcp::no_delay option ( true );
		socket_.set_option ( option );

		boost::asio::socket_base::send_buffer_size send_opt ( 65536 );
		boost::asio::socket_base::receive_buffer_size recv_opt ( 65536 );
		socket_.set_option ( send_opt );
		socket_.set_option ( recv_opt );
	}

	void start ( ) {
		read_headers ( );
	}

private:
	void read_headers ( ) {
		auto self = shared_from_this ( );

		boost::asio::async_read_until ( socket_, request_buffer_, "\r\n\r\n",
			[this, self]( const boost::system::error_code &err, size_t bytes ) {
				if ( !err ) {
					parse_headers_and_read_body ( );
				}
			} );
	}

	void parse_headers_and_read_body ( ) {
		std::istream stream ( &request_buffer_ );
		std::string request_line;
		std::getline ( stream, request_line );


		if ( !request_line.empty ( ) && request_line.back ( ) == '\r' ) {
			request_line.pop_back ( );
		}


		std::string method, path, version;
		std::istringstream ( request_line ) >> method >> path >> version;


		size_t method_end = method.find ( ' ' );
		if ( method_end != std::string::npos ) {
			method = method.substr ( 0, method_end );
		}


		size_t param_offset = path.find ( '?' );
		std::string api = path.substr ( 0, param_offset );
		std::string query = ( param_offset != std::string::npos ) ? path.substr ( param_offset + 1 ) : "";


		std::string header_line;
		size_t content_length = 0;
		content_type_ = "application/octet-stream";


		while ( std::getline ( stream, header_line ) && header_line != "\r" ) {
			if ( !header_line.empty ( ) && header_line.back ( ) == '\r' )
				header_line.pop_back ( );


			size_t col_pos = header_line.find ( ':' );
			if ( col_pos != std::string::npos ) {
				std::string key = header_line.substr ( 0, col_pos );
				std::string value = header_line.substr ( col_pos + 1 );


				boost::trim ( key );
				boost::trim ( value );
				boost::to_lower ( key );


				headers_ [key] = value;


				if ( key == "content-length" ) {
					content_length = std::stoul ( value );
				}
				else if ( key == "content-type" ) {
					content_type_ = value;
				}
			}
		}


		auto socket_ptr = std::make_shared<tcp::socket> ( std::move ( socket_ ) );
		request_ = std::make_shared<server_request> (
			socket_ptr,
			api,
			std::move ( query )
		);

		request_->method = method;
		request_->headers = headers_;


		read_body ( content_length );
	}


	void read_body ( size_t content_length ) {
		auto self = shared_from_this ( );


		std::string body;
		body.resize ( request_buffer_.size ( ) );

		std::istream stream ( &request_buffer_ );
		stream.read ( &body [0], body.size ( ) );

		size_t already_read = body.size ( );

		if ( content_length > already_read ) {
			auto buffer = std::make_shared<std::vector<char>> ( content_length - already_read );
			auto body_ptr = std::make_shared<std::string> ( std::move ( body ) );

			boost::asio::async_read ( *request_->socket, boost::asio::buffer ( *buffer ),
				[this, self, buffer, body_ptr]( const boost::system::error_code &err, size_t ) {
					if ( !err ) {
						body_ptr->append ( buffer->data ( ), buffer->size ( ) );
						process_request ( std::move ( *body_ptr ) );
					}
			} );
		}
		else {
			process_request ( std::move ( body ) );
		}
	}


	void process_request ( const std::string &body ) {
		if ( body.size ( ) > 100 * 1024 * 1024 ) {
			auto response = std::make_shared<text_response> (
				request_->socket, 413, "Payload Too Large",
				"text/plain", "413 Payload Too Large"
			);

			response->pack ( );

			return;
		}


		multipart_parser parser ( content_type_, body );
		request_->files = parser.parse_files ( );
		request_->forms = parser.parse_forms ( );


		static boost::asio::thread_pool worker_pool ( 4 );

		boost::asio::post ( worker_pool,
			[this, self = shared_from_this ( )]( ) {
				process_callback ( );
		} );
	}

	void process_callback ( ) {
		std::shared_ptr<server_response> response;


		for ( const auto &cm : methods_ ) {
			if ( cm.starts_with ( request_->method, request_->api ) ) {
				try {
					response = cm.callback_ ( request_ );
				}
				catch ( const std::exception &e ) {
					response = std::make_shared<text_response> (
						request_->socket,
						503,
						"Server Error",
						"text/plain",
						std::string ( "Server got an exception: " ) + e.what ( )
					);
				}

				break;
			}
		}

		if ( !response || response->empty ( ) ) {
			response = std::make_shared<text_response> (
				request_->socket,
				404,
				"Not Found",
				"text/plain",
				"404 Not Found"
			);
		}

		response->pack ( );
	}


	tcp::socket socket_;
	boost::asio::streambuf request_buffer_;
	std::unordered_map<std::string, std::string> headers_;
	std::string content_type_;
	std::shared_ptr<server_request> request_;
	std::vector<callback_method> &methods_;
};