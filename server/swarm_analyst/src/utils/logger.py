import logging
import colorama
from colorama import Fore, Style

colorama.init()

def get_logger(name: str):
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            f"{Fore.CYAN}%(name)s{Style.RESET_ALL} | %(levelname)s | {Fore.WHITE}%(message)s{Style.RESET_ALL}"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    return logger
