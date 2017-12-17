ipmi_lib = {
    "Variable_Bindings_Fields":[
        {
            "oct":[1,16],
            "name":"GUID",
            "Description":[
                [0,3,"time_low"],
                [4,5,"time_mid"],
                [6,7,"time_hi_and_version"],
                [8,8,"clock_seq_hi_and_reserved"],
                [9,9,"clock_seq_low"],
                [10,15,"node"]
            ]
        },
        {
            "oct":[17,18],
            "name":"Sequence Cookie",
        },
        {
            "oct":[19,22],
            "name":"Local Timestamp",
        },
        {
            "oct":[23,24],
            "name":"UTC Offset",
        },
        {
            "oct":25,
            "name":"Trap Source Type",
            "Description":[
                [0x00,0x07,"Platform Firmware"],
                [0x08,0x0f,"SMI Handler"],
                [0x10,0x17,"ISV System Management Software"],
                [0x18,0x1F,"Alert ASIC"],
                [0x20,0x27,"IPMI"],
                [0x28,0x2F,"BIOS Vendor"],
                [0x30,0x37,"System Board Set Vendor"],
                [0x38,0x3F,"System Integrator"],
                [0x40,0x47,"Third Party Add-in"],
                [0x48,0x4F,"OSV"],
                [0x50,0x57,"NIC"],
                [0x58,0x5F,"System Management Card"],
            ]
        },
        {
            "oct":26,
            "name":"Event Source Type",
            "Description":[
                [0x00,0x07,"Platform Firmware"],
                [0x08,0x0F,"SMI Handler"],
                [0x10,0x17,"ISV System Management Software"],
                [0x18,0x1F,"Alert ASIC"],
                [0x20,0x27,"IPMI"],
                [0x28,0x2F,"BIOS Vendor"],
                [0x30,0x37,"System Board Set Vendor"],
                [0x38,0x3F,"System Integrator"],
                [0x40,0x47,"Third Party Add-in"],
                [0x48,0x4F,"OSV"],
                [0x50,0x57,"NIC"],
                [0x58,0x5F,"System Management Card"],
            ]
        },
        {
            "oct":27,
            "name":"Event Severity",
        },
        {
            "oct":28,
            "name":"Sensor Device",
        },
        {
            "oct":29,
            "name":"Sensor Number",
        },
        {
            "oct":30,
            "name":"Entity",
        },
        {
            "oct":31,
            "name":"Entity Instance",
        },
        {
            "oct":[32,39],
            "name":"Event Data",
        },
        {
            "oct":40,
            "name":"Language Code",
        },
        {
            "oct":[41,44],
            "name":"Manufacturer ID",
        },
        {
            "oct":[45,46],
            "name":"System ID",
        },
        {
            "oct":47,
            "name":"OEM Custom Fields",
        },
    ],

    "Generic_Event_Types" : [
        {
            "code":0x01,
            "name":"Threshold",
            "Description":{
                0x00:"Lower Non-critical - going low",
                0x01:"Lower Non-critical - going high",
                0x02:"Lower Critical - going low",
                0x03:"Lower Critical - going high",
                0x04:"Lower Non-recoverable - going low",
                0x05:"Lower Non-recoverable - going high",
                0x06:"Upper Non-critical - going low",
                0x07:"Upper Non-critical - going high",
                0x08:"Upper Critical - going low",
                0x09:"Upper Critical - going high",
                0x0A:"Upper Non-recoverable - going low",
                0x0B:"Upper Non-recoverable - going high",
            }

        },
        {
            "code":0x02,
            "name":"Discrete",
            "Description":{
                0x00:"Transition to Idle",
                0x01:"Transition to Active",
                0x02:"Transition to Busy",
            }
        },
        {
            "code":0x03,
            "name":"'digital' Discrete",
            "Description":{
                0x00:"State Deasserted",
                0x01:"State Asserted",
            }
        },
        {
            "code":0x04,
            "name":"'digital' Discrete",
            "Description":{
                0x00:"Predictive Failure Deasserted",
                0x01:"Predictive Failure Asserted",
            }
        },
        {
            "code":0x05,
            "name":"'digital' Discrete",
            "Description":{
                0x00:"Limit Not Exceeded",
                0x01:"Limit Exceeded",
            }
        },
        {
            "code":0x06,
            "name":"'digital' Discrete",
            "Description":{
                0x00:"Performance Met",
                0x01:"Performance Lags",
            }
        },
        {
            "code":0x07,
            "name":"Discrete",
            "Description":{
                0x00:"transition to OK",
                0x01:"transition to Non-Critical from OK",
                0x02:"transition to Critical from Less Severe",
                0x03:"ransition to Non-recoverable from Less Severe",
                0x04:"transition to Non-Critical from More Severe",
                0x05:"transition to Critical from Non-recoverable",
                0x06:"transition to Non-recoverable",
                0x07:"Monitor",
                0x08:"Informational",
            }

        },
        {
            "code":0x08,
            "name":"'digital' Discrete",
            "Description":{
                0x00:"Device Removed / Device Absent",
                0x01:"Device Inserted / Device Present",
            }
        },
        {
            "code":0x09,
            "name":"'digital' Discrete",
            "Description":{
                0x00:"Device Disabled",
                0x01:"Device Enabled",
            }
        },
        {
            "code":0x0A,
            "name":"Discrete",
            "Description":{
                0x00:"transition to Running",
                0x01:"transition to In Test",
                0x02:"transition to Power Off",
                0x03:"transition to On Line",
                0x04:"transition to Off Line",
                0x05:"transition to Off Duty",
                0x06:"transition to Degraded",
                0x07:"transition to Power Save",
                0x08:"Install Error",
            }

        },
        {
            "code":0x0B,
            "name":"Discrete",
            "Description":{
                0x00:"Redundancy Regained",
                0x01:"Redundancy Lost",
                0x02:"Redundancy Degraded",
            }

        },
        {
            "code":0x0C,
            "name":"Discrete",
            "Description":{
                0x00:"D0",
                0x01:"D1",
                0x02:"D2",
                0x03:"D3",
            }

        },
    ],

    "Sensor_Types": [
        {
            "code":0x00,
            "name":"reserved",
        },
        {
            "code":0x01,
            "name":"Temperature",
        },
        {
            "code":0x02,
            "name":"Voltage",
        },
        {
            "code":0x03,
            "name":"Current",
        },
        {
            "code":0x04,
            "name":"Fan",
        },
        {
            "code":0x05,
            "name":"Physical Security",
            "Description":{
                0x00:"General Chassis Intrusion",
                0x01:"Drive Bay Intrusion",
                0x02:"I/O Card area Intrusion",
                0x03:"Processor area Intrusion",
                0x04:"LAN Leash Lost",
                0x05:"Unauthorized Dock/Undock",
            }
        },
        {
            "code":0x06,
            "name":"Platform Security Violation Attempt",
            "Description":{
                0x00:"Secure Mode Violation Attempt",
                0x01:"Pre-boot Password Violation - user password",
                0x02:"Pre-boot Password Violation Attempt - setup password",
                0x03:"Pre-boot Password Violation - network boot password",
                0x04:"Other pre-boot Password Violation",
                0x05:"Out-of-band Access Password Violation",
            }

        },
        {
            "code":0x07,
            "name":"Processor",
            "Description":{
                0x00:"IERR",
                0x01:"Thermal Trip",
                0x02:"FRB1/BIST Failure",
                0x03:"FRB2/Hang in POST Failure",
                0x04:"FRB3/Processor Startup/Initialization failure (CPU didn't start)",
                0x05:"Configuration Error (for DMI)",
                0x06:"SM BIOS 'Uncorrectable CPU-complex Error'",
                0x07:"Processor Presence Detected",
                0x08:"Processor Disabled",
                0x09:"Terminator Presence Detected",
            }

        },
        {
            "code":0x08,
            "name":"Power Supply",
            "Description":{
                0x00:"Presence Detected",
                0x01:"Power Supply Failure Detected",
                0x02:"Predictive Failure Asserted",
            }

        },
        {
            "code":0x09,
            "name":"Processor",
            "Description":{
                0x00:"Power Off / Power Down",
                0x01:"Power Cycle",
                0x02:"240VA Power Down",
                0x03:"Interlock Power Down",
                0x04:"A/C Lost",
                0x05:"Soft Power Control Failure (unit did not respond to request to turn on)",
                0x06:"Power Unit Failure Detected",
            }

        },
        {
            "code":0x0A,
            "name":"Cooling Device",
        },
        {
            "code":0x0B,
            "name":"Other Units-based Senso",
        },
        {
            "code":0x0C,
            "name":"Memory",
            "Description":{
                0x00:"Correctable ECC",
                0x01:"Uncorrectable ECC",
                0x02:"Parity",
                0x03:"Memory Scrub Failed (stuck bit)"
            }

        },
        {
            "code":0x0D,
            "name":"Drive Slot",
        },
        {
            "code":0x0E,
            "name":"POST Memory Resize",
        },
        {
            "code":0x0F,
            "name":"POST Error",
        },
        {
            "code":0x10,
            "name":"Event Logging Disabled",
            "Description":{
                0x00:"Correctable Memory Error Logging Disabled",
                0x01:"Event 'Type' Logging Disabled",
                0x02:"Log Area Reset/Cleared",
                0x03:"All Event Logging Disabled",
            }

        },
        {
            "code":0x11,
            "name":"Watchdog 1",
            "Description":{
                0x00:"BIOS Watchdog Reset",
                0x01:"OS Watchdog Reset",
                0x02:"OS Watchdog Shut Down",
                0x03:"OS Watchdog Power Down",
                0x04:"OS Watchdog Power Cycle",
                0x05:"OS Watchdog NMI",
                0x06:"OS Watchdog Expired, status only",
                0x07:"OS Watchdog Pre-timeout Interrupt, non-NMI",
            }

        },
        {
            "code":0x12,
            "name":"System Event",
            "Description":{
                0x00:"System Reconfigured",
                0x01:"OEM System Boot Event",
                0x02:"Undetermined system hardware failure",
            }

        },
        {
            "code":0x13,
            "name":"Critical Interrupt",
            "Description":{
                0x00:"Front Panel NMI",
                0x01:"Bus Timeout",
                0x02:"I/O Channel Check NMI",
                0x03:"Software NMI",
                0x04:"PCI PERR",
                0x05:"PCI SERR",
                0x06:"EISA Fail Safe Timeout",
                0x07:"Bus Correctable Error",
                0x08:"Bus Uncorrectable Error",
                0x09:"Fatal NMI",
            }

        },
        {
            "code":0x14,
            "name":"Button",
        },
        {
            "code":0x15,
            "name":"Module / Board",
        },
        {
            "code":0x16,
            "name":"Microcontroller / Coprocessor",
        },
        {
            "code":0x17,
            "name":"Add-in Card",
        },
        {
            "code":0x18,
            "name":"Chassis",
        },
        {
            "code":0x19,
            "name":"Chip Set",
        },
        {
            "code":0x1A,
            "name":"Other FRU",
        },
        {
            "code":0x1B,
            "name":"Cable / Interconnect",
        },
        {
            "code":0x1C,
            "name":"Terminator",
        },
            {
            "code":0x1D,
            "name":"System Boot Initiated",
            "Description":{
                0x00:"Initiated by power up",
                0x01:"Initiated by hard reset",
                0x02:"Initiated by warm reset",
                0x03:"User requested PXE boot",
                0x04:"Automatic boot to diagnostic",
            }

        },
            {
            "code":0x1E,
            "name":"Boot Error",
            "Description":{
                0x00:"No bootable media",
                0x01:"Non-bootable diskette left in drive",
                0x02:"PXE Server not found",
                0x03:"Invalid boot sector",
                0x04:"Timeout waiting for user selection of boot source",
            }

        },
            {
            "code":0x1F,
            "name":"OS Boot",
            "Description":{
                0x00:"A: boot completed",
                0x01:"C: boot completed",
                0x02:"PXE boot completed",
                0x03:"Diagnostic boot completed",
                0x04:"CD-ROM boot completed",
                0x05:"ROM boot completed",
                0x06:"Boot completed - boot device not specified",
            }

        },
            {
            "code":0x20,
            "name":"OS Critical Stop",
            "Description":{
                0x00:"Stop during OS load / initialization",
                0x01:"Run-time Stop",
            }

        },
        {
            "code":0x21,
            "name":"Slot / Connector",
            "Description":{
                0x00:"Fault Status asserted",
                0x01:"Identify Status asserted",
                0x02:"Slot / Connector Device installed/attached",
                0x03:"Slot / Connector Ready for Device Installation - Typically, this means that \
                    the slot power is off. The Ready for Installation, Ready for Removal, \
                    and Slot Power states can transition together, depending on the slot \
                    implementation.",
                0x04:"Slot/Connector Ready for Device Removal - Typically, this means that the \
                    slot power is off.",
                0x05:"Slot Power is Off",
                0x06:"Slot / Connector Device Removal Request - This is typically connected to \
                    a switch that becomes asserted to request removal of the device",
                0x07:"Interlock asserted - This is typically connected to a switch that \
                    mechanically enables/disables power to the slot, or locks the slot in \
                    the 'Ready for Installation / Ready for Removal states'depending \
                    on the slot implementation. The asserted state indicates that the \
                    lockout is active.",
            }

        },
        {
            "code":0x22,
            "name":"System ACPI Power State",
            "Description":{
                0x00:'S0 / G0 "working"',
                0x01:'S1 "sleeping with system h/w & processor context maintained"',
                0x02:'S2 "sleeping, processor context lost"',
                0x03:'S3 "sleeping, processor & h/w context lost, memory retained."',
                0x04:'S4 "non-volatile sleep / suspend-to disk"',
                0x05:'S5 / G2 "soft-off"',
                0x06:"S4 / S5 soft-off, particular S4 / S5 state cannot be determined",
                0x07:"G3 / Mechanical Off",
                0x08:"Sleeping in an S1, S2, or S3 states",
                0x09:"G1 sleeping",
            }

        },
        {
            "code":0x23,
            "name":"Watchdog 2",
            "Description":{
                0x00:"Timer expired, status only (no action, no interrupt)",
                0x01:"Hard Reset",
                0x02:"Power Down",
                0x03:"Power Cycle",
                0x08:"Timer interrupt",
            }

        },
        {
            "code":0x24,
            "name":"Platform Alert",
            "Description":{
                0x00:"Platform generated page.",
                0x01:"Platform generated LAN alert.",
                0x02:"Platform Event Trap generated, formatted per IPMI PET specification.",
                0x03:"Platform generated SNMP trap, OEM format.",
            }

        },
        {
            "code":0x25,
            "name":"Entity Presence",
            "Description":{
                0x00: "Entity Present. This indicates that the Entity identified by the Entity ID for \
                        the sensor is present",
                0x01: "Entity Absent. This indicates that the Entity identified by the Entity ID for \
                the sensor is absent. If the entity is absent, system management software \
                should consider all sensors associated with that Entity to be absent as \
                well-and ignore those sensors."
            }
        },
        {
            "code":0x26,
            "name":"Monitor ASIC / IC"
        },
        {
            "code":0x27,
            "name":"LAN",
             "Description":{
                0x00:"LAN Heartbeat Lost"
            }
        },
        {
            "code":"Remaining",
            "name":"Reserved"
        },
        {
            "code":[0xC0,0xFF],
            "name":"OEM RESERVED"
        },
        
    ]
}

assert_feild = {
    0: "Asserted",
    1: "Deasserted"
    }
