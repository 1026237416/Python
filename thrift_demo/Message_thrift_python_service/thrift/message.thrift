namespace java com.li.thrift.message
namespace py message.api

service MessageService{
    bool sendMobileMessge(1:string mobile, 2:string message)

    bool sendEmailMessge(1:string email, 2:string message)
}