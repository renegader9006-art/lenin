#pragma once


#include <string>
#include <memory>
#include <fstream>
#include <boost/asio.hpp>
#include "header_builder.hpp"
#include <map>


using boost::asio::ip::tcp;


#define text_resp(...) std::static_pointer_cast<server_response>(std::make_shared<text_response>(__VA_ARGS__))
#define file_resp(...) std::static_pointer_cast<server_response>(std::make_shared<file_response>(__VA_ARGS__))
#define redirect_resp(...) std::static_pointer_cast<server_response>(std::make_shared<redirect_response>(__VA_ARGS__))


class server_response : public std::enable_shared_from_this<server_response> {
public:
        std::shared_ptr<tcp::socket> socket;
        int status;
        std::string status_text;
        std::string content_type;
        std::map<std::string, std::string> headers;

        server_response (
                std::shared_ptr<tcp::socket> socket = nullptr,
                int status = 404,
                const std::string &status_text = "",
                const std::string &content_type = ""
        ) : socket ( socket ), status ( status ), status_text ( status_text ), content_type ( content_type ) {
        }


        ~server_response ( ) = default;


        bool empty ( ) {
                return !socket;
        }


        virtual void pack ( ) = 0;
};


class text_response : public server_response {
public:
        std::string body;

        text_response (
                std::shared_ptr<tcp::socket> socket = nullptr,
                int status = 404,
                std::string status_text = "",
                std::string content_type = "",
                std::string body = ""
        )
                : server_response ( std::move ( socket ), status, std::move ( status_text ), std::move ( content_type ) ),
                body ( std::move ( body ) ) {
        }


        void pack ( ) override {
                if ( !socket || !socket->is_open ( ) ) return;

                header_builder hb;
                hb.status ( this->status, this->status_text )
                  .header ( "Content-Type", this->content_type );
                
                for (const auto& [key, value] : headers) {
                        hb.header(key, value);
                }
                
                std::string response = hb.body ( this->body ).build ( );

                boost::asio::async_write ( *socket, boost::asio::buffer ( response ),
                        [self = this->shared_from_this ( )]( const boost::system::error_code &err, size_t ) {
                                self->socket->close ( );
                        }
                );
        }
};


class redirect_response : public server_response {
public:
    std::string location;

    redirect_response(
        std::shared_ptr<tcp::socket> socket = nullptr,
        int status = 404,
        std::string status_text = "",
        std::string location = ""
    )
        : server_response(std::move(socket), status, std::move(status_text), ""),
        location(std::move(location)) {
    }


    void pack() override {
        if (!socket || !socket->is_open()) return;

        header_builder hb;
        hb.status(this->status, this->status_text)
            .header("Location", this->location);

        for (const auto& [key, value] : headers) {
            hb.header(key, value);
        }

        std::string response = hb.build();

        boost::asio::async_write(*socket, boost::asio::buffer(response),
            [self = this->shared_from_this()](const boost::system::error_code& err, size_t) {
                self->socket->close();
            }
        );
    }
};


enum class OpenType {
        INLINE, ATTACHMENT
};



class file_response : public server_response {
public:
        std::string path;
        std::string name;
        OpenType type;

        file_response (
                std::shared_ptr<tcp::socket> socket = nullptr,
                int status = 404,
                std::string status_text = "",
                std::string content_type = "",
                std::string filepath = "",
                std::string filename = "",
                OpenType fileview = OpenType::ATTACHMENT
        )
                : server_response ( std::move ( socket ), status, std::move ( status_text ), std::move ( content_type ) ),
                path ( std::move ( filepath ) ),
                name ( std::move ( filename ) ),
                type ( fileview )
        {
        }
        void pack ( ) override {
                std::shared_ptr<std::ifstream> file = std::make_shared<std::ifstream> ( path, std::ios::binary );

                if ( !file->is_open ( ) ) {
                        return;
                }

                file->seekg ( 0, std::ios::end );
                size_t file_size = file->tellg ( );
                file->seekg ( 0, std::ios::beg );

                std::string disposition;
                if ( type == OpenType::INLINE ) {
                        disposition = "inline; filename=\"" + name + "\"";
                }
                else {
                        disposition = "attachment; filename=\"" + name + "\"";
                }

                header_builder hb;
                hb.status ( this->status, this->status_text )
                  .header ( "Content-Type", this->content_type )
                  .header ( "Content-Disposition", disposition )
                  .header ( "Content-Length", std::to_string ( file_size ) )
                  .header ( "Connection", "close" );
                
                for (const auto& [key, value] : headers) {
                        hb.header(key, value);
                }
                
                std::string response = hb.body ( "" ).build ( );

                boost::asio::async_write ( *socket, boost::asio::buffer ( response ),
                        [
                                self = std::dynamic_pointer_cast<file_response>( this->shared_from_this ( ) ),
                                file, file_size
                        ] ( const boost::system::error_code &err, size_t ) {
                                if ( err ) return;

                                self->send_chunk ( file, file_size, 0 );
                        }
                );
        }

        void send_chunk (
                std::shared_ptr<std::ifstream> file,
                size_t file_size,
                size_t offset
        ) {
                const size_t chunk_size = 8192;

                if ( offset >= file_size ) {
                        socket->close ( );

                        return;
                }

                size_t size = std::min ( chunk_size, file_size - offset );
                std::shared_ptr<std::vector<char>> buffer = std::make_shared<std::vector<char>> ( size );

                file->seekg ( offset );
                file->read ( buffer->data ( ), size );

                boost::asio::async_write ( *socket, boost::asio::buffer ( *buffer ),
                        [
                                self = std::dynamic_pointer_cast<file_response>( this->shared_from_this ( ) ),
                                file, file_size, offset, buffer
                        ] ( const boost::system::error_code &err, size_t ) {
                                if ( err ) {
                                        self->socket->close ( );

                                        return;
                                }

                                self->send_chunk ( file, file_size, offset + buffer->size ( ) );
                        }
                );
        }
};