# TAGO API Reference (Bus alerts)

This skill uses Korea MOLIT TAGO OpenAPI via data.go.kr.

**Never write API keys/serviceKey values into this repository.**

## Stop info (정류장 조회)
Dataset: `국토교통부_(TAGO)_버스정류소정보` (15098534)

Example operation (nearby stops by GPS):
- Base: `https://apis.data.go.kr/1613000/BusSttnInfoInqireService`
- Path: `/getCrdntPrxmtSttnList`
- Required: `serviceKey`, `gpsLati`, `gpsLong`
- Useful response fields: `nodeid`, `nodenm`, `citycode`, `gpslati`, `gpslong`

## Arrival info (도착 정보)
Dataset: `국토교통부_(TAGO)_버스도착정보` (15098530)

Stop-based arrival list:
- Base: `https://apis.data.go.kr/1613000/ArvlInfoInqireService`
- Path: `/getSttnAcctoArvlPrearngeInfoList`
- Required: `serviceKey`, `cityCode`, `nodeId`
- Useful response fields:
  - `routeno` (노선 번호)
  - `arrtime` (도착예상시간, seconds)
  - `arrprevstationcnt` (몇 정거장 전)
  - `routeid` (노선ID)
  - `nodenm` (정류소명)

## Notes
- City codes are required; if only stop name is provided, you may need to search/resolve `cityCode`.
- Some stop names have multiple directions (road sides). Confirm with the user before creating a scheduled rule.
