$files = Get-ChildItem -Filter *.html

$map = @{
    # We will use Base64 for the keys and values
    # เธšเธฃเธดเธ เธฒเธฃเธ‹เนˆเธญเธก -> บริการซ่อม
    '4Lia4Lij4Li04LiB4Liy4Lij4LiL4LmI4Lit4Lih' = '4Lia4Lij4Li04LiB4Liy4Lij4LiL4LmI4Lit4Lih'; # wait no, I need the bytes of the BAD string in utf8
}

# The easiest way to get the bad base64 strings is locally from my end, but I don't have python.
# Let's just use the known translation mapping with a safer regex replacing technique by passing an external file!
