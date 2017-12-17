if __name__ == '__main__':
    a = [{
        "name":"litao3",
        "age":1
    },{
        "name":"litao2",
        "age":3
    },{
        "name":"litao1",
        "age":2
    }]

    print sorted(a,key=lambda x: x['age'], reverse=False)