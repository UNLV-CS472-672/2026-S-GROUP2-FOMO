from datetime import datetime

def log(message: str) -> None:
    now = datetime.now()
    pretty_time = f"[{now.strftime("%H:%M:%S %m/%d/%y")}]"
    print(f"{pretty_time} {message}")