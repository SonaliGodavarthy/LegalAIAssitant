import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from ingest.ingest import detect_language


def test_detect_language_german():
    assert detect_language("german_bgb.pdf") == "german"


def test_detect_language_english():
    assert detect_language("english_bgb.pdf") == "english"


def test_detect_language_unknown_prefix():
    assert detect_language("other.pdf") == "unknown"


def test_detect_language_empty_string():
    assert detect_language("") == "unknown"


def test_detect_language_german_hgb():
    assert detect_language("german_hgb.pdf") == "german"


def test_detect_language_english_gg():
    assert detect_language("english_gg.pdf") == "english"


def test_detect_language_no_prefix():
    assert detect_language("kschg.pdf") == "unknown"


def test_detect_language_german_prefix_only():
    # Edge: filename starts with "german_" but has no extension
    assert detect_language("german_") == "german"


def test_detect_language_english_prefix_only():
    assert detect_language("english_") == "english"
