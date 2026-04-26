#include <string>


class header_builder {
private:
        std::string buffer;


public:
        header_builder ( ) {
                buffer.reserve ( 512 );
        }


        header_builder &status ( int num, std::string_view text ) {
                buffer += "HTTP/1.1 ";
                buffer += std::to_string ( num );
                buffer += ' ';
                buffer += text;
                buffer += "\r\n";

                return *this;
        }


        header_builder &header ( std::string_view name, std::string_view value ) {
                buffer += name;
                buffer += ": ";
                buffer += value;
                buffer += "\r\n";

                return *this;
        }


        header_builder &body ( std::string_view content ) {
                if ( !content.empty ( ) ) {
                        if ( buffer.find ( "\r\nContent-Length:" ) == std::string::npos && buffer.find ( "Content-Length:" ) == std::string::npos ) {
                                buffer += "Content-Length: ";
                                buffer += std::to_string ( content.size ( ) );
                                buffer += "\r\n";
                        }

                        buffer += "\r\n";
                        buffer += content;
                }
                else {
                        buffer += "\r\n";
                }

                return *this;
        }


        std::string build ( ) {
                return std::move ( buffer );
        }
};