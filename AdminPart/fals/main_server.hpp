#pragma once 


#include "server_request.hpp"
#include "server_response.hpp"
#include "server_session.hpp"

#include <functional>
#include <iostream>



using boost::asio::ip::tcp;



class MainServer {
private:
    boost::asio::io_context ioc_;
    tcp::acceptor acceptor_;
    std::vector<std::thread> thread_pool_;
    std::vector<callback_method> methods_;

public:
    MainServer ( short port, size_t thread_count = std::thread::hardware_concurrency ( ) )
        : acceptor_ ( ioc_, tcp::endpoint ( tcp::v4 ( ), port ) ) {

        start_accept ( );

        for ( size_t i = 0; i < thread_count; ++i ) {
            thread_pool_.emplace_back ( [this]( ) {
                ioc_.run ( );
            } );
        }
    }

    ~MainServer ( ) {
        ioc_.stop ( );

        for ( auto &t : thread_pool_ ) {
            if ( t.joinable ( ) ) t.join ( );
        }
    }

    void add_callback ( callback_method &&method ) {
        methods_.push_back ( std::move ( method ) );
    }

private:
    void start_accept ( ) {
        acceptor_.async_accept (
            [this]( const boost::system::error_code &err, tcp::socket socket ) {
                if ( !err ) {
                    std::make_shared<Session> ( std::move ( socket ), methods_ )->start ( );
                }

                start_accept ( );
            } );
    }
};