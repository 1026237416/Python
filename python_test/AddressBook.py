class AddressBookEntry(object):
    version = 0.1
    
    def __init__(self, name, phone):
        self.name = name
        self.phone = phone
        
    def update_phone(self, phone):
        self.phone = phone
        
jhon = AddressBookEntry("Jhon", "123-456-789")
jane = AddressBookEntry("Jane", "400-456-789")

print jhon.phone
print jhon.name

jhon.update_phone("111-111-111")
print jhon.phone

print "*********************************************************************"
class EmployeeAddressBookEntry(AddressBookEntry):
    def __init__(self, name, phone, id, social):
        AddressBookEntry.__init__(self, name, phone)
        self.empid = id
        self.ssn = social
        
sam = EmployeeAddressBookEntry("sam", "222-222-222", "666", "dsx")

print sam.name
print sam.phone
print sam.empid
print sam.ssn

sam.update_phone("333-3333-333")
print sam.phone


