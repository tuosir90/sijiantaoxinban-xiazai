import time


def test_report_store_expires():
    from app.services.report_store import InMemoryReportStore

    store = InMemoryReportStore(ttl_seconds=1)
    report_id = store.save({"module": "brand", "markdown": "# hi"})
    assert store.get(report_id)["markdown"] == "# hi"

    time.sleep(1.2)
    assert store.get(report_id) is None

