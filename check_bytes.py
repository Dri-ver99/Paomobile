
path = r"c:\Users\Lazy\Desktop\Paomobile Web Main\promotions.html"
with open(path, "rb") as f:
    data = f.read(2000)
    print(" ".join(f"{b:02X}" for b in data))
