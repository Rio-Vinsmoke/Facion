
print("Checking FACION AI dependencies...")

try:
    from rembg import remove, new_session

    print("SUCCESS: rembg Python API imported.")
    print("Ready to test background removal.")

except Exception as error:
    print("FAILED:", type(error).__name__)
    print(str(error))
