// Start of HEAD
#include <iostream>
#include <string>
#include <vector>
#include <cmath>
#include <sstream>
#include <json/json.h>

using namespace std;

int main() {
    string input_str((istreambuf_iterator<char>(cin)), istreambuf_iterator<char>());
    Json::Value input_data;
    Json::CharReaderBuilder rb;
    string errs;
    istringstream ss(input_str);
    Json::parseFromStream(rb, ss, &input_data, &errs);

    double mapW = input_data["map_size"][0].asDouble();
    double mapH = input_data["map_size"][1].asDouble();
    double warehouseX = mapW / 2.0, warehouseY = mapH / 2.0;
    Json::Value drones = input_data["drones"];
    Json::Value deliveries = input_data["deliveries"];
    Json::Value no_fly_zones = input_data.get("no_fly_zones", Json::Value(Json::arrayValue));
    Json::Value charging_stations = input_data.get("charging_stations", Json::Value(Json::arrayValue));
// End of HEAD

// Start of BODY
    Json::Value flight_manifest(Json::arrayValue);

    struct Del { string id; double x, y, w, dl; };
    struct NF { string sh; double cx, cy, r, x0, y0, x1, y1, ts, te; };
    struct Sta { double x, y; int slots; };

    int nDel = (int)deliveries.size();
    int nDrn = (int)drones.size();
    int nNfz = (int)no_fly_zones.size();
    int nSta = (int)charging_stations.size();

    vector<Del> allD(nDel);
    for (int i = 0; i < nDel; i++) {
        allD[i].id = deliveries[i]["id"].asString();
        allD[i].x  = deliveries[i]["x"].asDouble();
        allD[i].y  = deliveries[i]["y"].asDouble();
        allD[i].w  = deliveries[i]["weight"].asDouble();
        allD[i].dl = deliveries[i]["deadline"].asDouble();
    }

    vector<NF> nfL(nNfz);
    for (int i = 0; i < nNfz; i++) {
        nfL[i].sh = no_fly_zones[i]["shape"].asString();
        nfL[i].ts = no_fly_zones[i]["T_start"].asDouble();
        nfL[i].te = no_fly_zones[i]["T_end"].asDouble();
        if (nfL[i].sh == "circle") {
            nfL[i].cx = no_fly_zones[i]["center"][0].asDouble();
            nfL[i].cy = no_fly_zones[i]["center"][1].asDouble();
            nfL[i].r  = no_fly_zones[i]["radius"].asDouble();
        } else {
            nfL[i].x0 = no_fly_zones[i]["corners"][0][0].asDouble();
            nfL[i].y0 = no_fly_zones[i]["corners"][0][1].asDouble();
            nfL[i].x1 = no_fly_zones[i]["corners"][1][0].asDouble();
            nfL[i].y1 = no_fly_zones[i]["corners"][1][1].asDouble();
            if (nfL[i].x0 > nfL[i].x1) { double tmp = nfL[i].x0; nfL[i].x0 = nfL[i].x1; nfL[i].x1 = tmp; }
            if (nfL[i].y0 > nfL[i].y1) { double tmp = nfL[i].y0; nfL[i].y0 = nfL[i].y1; nfL[i].y1 = tmp; }
        }
    }

    vector<Sta> staL(nSta);
    for (int i = 0; i < nSta; i++) {
        staL[i].x = charging_stations[i]["x"].asDouble();
        staL[i].y = charging_stations[i]["y"].asDouble();
        staL[i].slots = charging_stations[i]["slots"].asInt();
    }

    struct DistFn {
        double operator()(double ax, double ay, double bx, double by) {
            double dx = bx - ax, dy = by - ay;
            return sqrt(dx * dx + dy * dy);
        }
    };
    DistFn eDist;

    struct SafeDepFn {
        vector<NF>* nfp;
        int nnfz;
        DistFn* df;

        double operator()(double ax, double ay, double bx, double by, double t0) {
            double d = (*df)(ax, ay, bx, by);
            if (d < 1e-9) return t0;
            double ddx = bx - ax, ddy = by - ay;
            double t = t0;
            for (int iter = 0; iter < 30; iter++) {
                double mw = 0;
                for (int i = 0; i < nnfz; i++) {
                    NF& z = (*nfp)[i];
                    double s1 = 0, s2 = 1;
                    if (z.sh == "circle") {
                        double fx = ax - z.cx, fy = ay - z.cy;
                        double qa = ddx * ddx + ddy * ddy;
                        double qb = 2.0 * (fx * ddx + fy * ddy);
                        double qc = fx * fx + fy * fy - z.r * z.r;
                        double disc = qb * qb - 4.0 * qa * qc;
                        if (disc < 0) continue;
                        double sq = sqrt(disc);
                        s1 = (-qb - sq) / (2.0 * qa);
                        s2 = (-qb + sq) / (2.0 * qa);
                    } else {
                        if (fabs(ddx) > 1e-12) {
                            double v1 = (z.x0 - ax) / ddx;
                            double v2 = (z.x1 - ax) / ddx;
                            if (v1 > v2) { double tmp = v1; v1 = v2; v2 = tmp; }
                            if (v1 > s1) s1 = v1;
                            if (v2 < s2) s2 = v2;
                        } else if (ax < z.x0 || ax > z.x1) continue;
                        if (fabs(ddy) > 1e-12) {
                            double v1 = (z.y0 - ay) / ddy;
                            double v2 = (z.y1 - ay) / ddy;
                            if (v1 > v2) { double tmp = v1; v1 = v2; v2 = tmp; }
                            if (v1 > s1) s1 = v1;
                            if (v2 < s2) s2 = v2;
                        } else if (ay < z.y0 || ay > z.y1) continue;
                    }
                    if (s1 < 0) s1 = 0;
                    if (s2 > 1) s2 = 1;
                    if (s1 >= s2) continue;
                    double et = t + s1 * d;
                    double lt = t + s2 * d;
                    if (et < z.te && lt > z.ts) {
                        double w = z.te - t - s1 * d + 0.01;
                        if (w > mw) mw = w;
                    }
                }
                if (mw < 1e-9) return t;
                t += mw;
            }
            return t;
        }
    };
    SafeDepFn safeDep;
    safeDep.nfp = &nfL;
    safeDep.nnfz = nNfz;
    safeDep.df = &eDist;

    struct DetourFn {
        vector<NF>* nfp;
        int nnfz;
        DistFn* df;
        SafeDepFn* sdp;

        bool tryDetour(double ax, double ay, double bx, double by, double t0,
                       double& wx, double& wy) {
            double d = (*df)(ax, ay, bx, by);
            if (d < 1e-9) return false;
            double ddx = bx - ax, ddy = by - ay;
            double nx = -ddy / d, ny = ddx / d;

            for (int i = 0; i < nnfz; i++) {
                NF& z = (*nfp)[i];
                if (z.sh != "circle") continue;
                double s1c = 0, s2c = 1;
                double fx = ax - z.cx, fy = ay - z.cy;
                double qa = ddx * ddx + ddy * ddy;
                double qb = 2.0 * (fx * ddx + fy * ddy);
                double qc = fx * fx + fy * fy - z.r * z.r;
                double disc = qb * qb - 4.0 * qa * qc;
                if (disc < 0) continue;
                double sq = sqrt(disc);
                s1c = (-qb - sq) / (2.0 * qa);
                s2c = (-qb + sq) / (2.0 * qa);
                if (s1c < 0) s1c = 0;
                if (s2c > 1) s2c = 1;
                if (s1c >= s2c) continue;
                double et = t0 + s1c * d;
                if (et >= z.te) continue;

                double margin = z.r + 2.0;
                double w1x = z.cx + nx * margin, w1y = z.cy + ny * margin;
                double w2x = z.cx - nx * margin, w2y = z.cy - ny * margin;

                double d1 = (*df)(ax, ay, w1x, w1y) + (*df)(w1x, w1y, bx, by);
                double d2 = (*df)(ax, ay, w2x, w2y) + (*df)(w2x, w2y, bx, by);

                double cwx, cwy;
                if (d1 <= d2) { cwx = w1x; cwy = w1y; }
                else { cwx = w2x; cwy = w2y; }

                double dep1 = (*sdp)(ax, ay, cwx, cwy, t0);
                double arr1 = dep1 + (*df)(ax, ay, cwx, cwy);
                double dep2 = (*sdp)(cwx, cwy, bx, by, arr1);
                double totalWait = (dep1 - t0) + (dep2 - arr1);

                double directDep = (*sdp)(ax, ay, bx, by, t0);
                double directWait = directDep - t0;

                if (totalWait < directWait - 1.0) {
                    wx = cwx; wy = cwy;
                    return true;
                }
            }
            return false;
        }
    };
    DetourFn detour;
    detour.nfp = &nfL;
    detour.nnfz = nNfz;
    detour.df = &eDist;
    detour.sdp = &safeDep;

    vector<bool> assigned(nDel, false);
    vector<double> droneAvail(nDrn, 0.0);
    vector<Json::Value> dpaths(nDrn);
    for (int i = 0; i < nDrn; i++) dpaths[i] = Json::Value(Json::arrayValue);

    for (int tripIter = 0; tripIter < 300; tripIter++) {
        int bd = -1;
        double bt = 1e18;
        for (int i = 0; i < nDrn; i++) {
            if (droneAvail[i] < bt) { bt = droneAvail[i]; bd = i; }
        }
        if (bd < 0 || bt >= 1e17) break;

        double maxPay = drones[bd]["max_payload"].asDouble();
        double startT = droneAvail[bd];

        vector<int> trip;
        double tripW = 0, sumDist = 0, cumEnergy = 0;
        double cx = warehouseX, cy = warehouseY, ct = startT;
        vector<bool> skip(nDel, false);
        int failures = 0;

        while (failures < 15) {
            int bestJ = -1;
            double bestDist = 1e18;
            for (int j = 0; j < nDel; j++) {
                if (assigned[j] || skip[j]) continue;
                if (tripW + allD[j].w > maxPay + 1e-9) continue;
                double d = eDist(cx, cy, allD[j].x, allD[j].y);
                if (ct + d > allD[j].dl) { skip[j] = true; continue; }
                if (d < bestDist) { bestDist = d; bestJ = j; }
            }
            if (bestJ < 0) break;

            double d = eDist(cx, cy, allD[bestJ].x, allD[bestJ].y);
            double dep = safeDep(cx, cy, allD[bestJ].x, allD[bestJ].y, ct);
            double arr = dep + d;
            if (arr > allD[bestJ].dl) { skip[bestJ] = true; failures++; continue; }

            double extraPrev = sumDist * allD[bestJ].w;
            double newLegE = d * (1.0 + allD[bestJ].w);
            double newCumE = cumEnergy + extraPrev + newLegE;

            double retDist = eDist(allD[bestJ].x, allD[bestJ].y, warehouseX, warehouseY);
            double totalE = newCumE + retDist * 1.0;

            bool canRet = (totalE <= 500.0 + 1e-9);
            if (!canRet) {
                for (int si = 0; si < nSta; si++) {
                    double dToS = eDist(allD[bestJ].x, allD[bestJ].y, staL[si].x, staL[si].y);
                    double eToS = dToS * 1.0;
                    if (newCumE + eToS <= 500.0 + 1e-9) { canRet = true; break; }
                }
            }
            if (!canRet) { skip[bestJ] = true; failures++; continue; }

            trip.push_back(bestJ);
            cumEnergy = newCumE;
            sumDist += d;
            tripW += allD[bestJ].w;
            cx = allD[bestJ].x; cy = allD[bestJ].y;
            ct = arr;
            failures = 0;
        }

        if (trip.empty()) {
            bool anyLeft = false;
            for (int j = 0; j < nDel; j++) if (!assigned[j]) { anyLeft = true; break; }
            if (!anyLeft) break;
            droneAvail[bd] = 1e18;
            continue;
        }

        double payload = 0;
        for (int ki = 0; ki < (int)trip.size(); ki++) payload += allD[trip[ki]].w;

        Json::Value pu;
        pu["x"] = warehouseX; pu["y"] = warehouseY; pu["t"] = startT;
        pu["action"] = "PICKUP";
        Json::Value dids(Json::arrayValue);
        for (int ki = 0; ki < (int)trip.size(); ki++) dids.append(allD[trip[ki]].id);
        pu["delivery_ids"] = dids;
        dpaths[bd].append(pu);

        cx = warehouseX; cy = warehouseY; ct = startT;
        double bat = 500.0, pl = payload;

        for (int ki = 0; ki < (int)trip.size(); ki++) {
            int j = trip[ki];
            double d = eDist(cx, cy, allD[j].x, allD[j].y);
            double dep = safeDep(cx, cy, allD[j].x, allD[j].y, ct);
            double directWait = dep - ct;

            double wx, wy;
            bool useDetour = false;
            if (directWait > 1.0) {
                useDetour = detour.tryDetour(cx, cy, allD[j].x, allD[j].y, ct, wx, wy);
            }

            if (useDetour) {
                double dw = eDist(cx, cy, wx, wy);
                double depW = safeDep(cx, cy, wx, wy, ct);
                if (depW > ct + 1e-9) {
                    Json::Value wt;
                    wt["x"] = cx; wt["y"] = cy; wt["t"] = depW; wt["action"] = "WAIT";
                    dpaths[bd].append(wt); ct = depW;
                }
                double leW = dw * (1.0 + pl);
                bat -= leW; ct += dw;
                cx = wx; cy = wy;
                Json::Value wp;
                wp["x"] = cx; wp["y"] = cy; wp["t"] = ct; wp["action"] = "WAYPOINT";
                dpaths[bd].append(wp);

                double d2 = eDist(cx, cy, allD[j].x, allD[j].y);
                double dep2 = safeDep(cx, cy, allD[j].x, allD[j].y, ct);
                if (dep2 > ct + 1e-9) {
                    Json::Value wt;
                    wt["x"] = cx; wt["y"] = cy; wt["t"] = dep2; wt["action"] = "WAIT";
                    dpaths[bd].append(wt); ct = dep2;
                }
                double le2 = d2 * (1.0 + pl);
                bat -= le2; ct += d2;
            } else {
                if (dep > ct + 1e-9) {
                    Json::Value wt;
                    wt["x"] = cx; wt["y"] = cy; wt["t"] = dep; wt["action"] = "WAIT";
                    dpaths[bd].append(wt); ct = dep;
                }
                double le = d * (1.0 + pl);
                bat -= le; ct += d;
            }

            cx = allD[j].x; cy = allD[j].y;
            pl -= allD[j].w;
            Json::Value dv;
            dv["x"] = cx; dv["y"] = cy; dv["t"] = ct;
            dv["action"] = "DELIVER"; dv["delivery_id"] = allD[j].id;
            dpaths[bd].append(dv);
            assigned[j] = true;
        }

        double dBack = eDist(cx, cy, warehouseX, warehouseY);
        double eBack = dBack * (1.0 + pl);

        if (bat - eBack < -1e-9) {
            int bestCS = -1; double bestCD = 1e18;
            for (int si = 0; si < nSta; si++) {
                double dToS = eDist(cx, cy, staL[si].x, staL[si].y);
                double eToS = dToS * (1.0 + pl);
                if (bat - eToS < -1e-9) continue;
                double dSW = eDist(staL[si].x, staL[si].y, warehouseX, warehouseY);
                if (dToS + dSW < bestCD) { bestCD = dToS + dSW; bestCS = si; }
            }
            if (bestCS >= 0) {
                double csx = staL[bestCS].x, csy = staL[bestCS].y;
                double dToS = eDist(cx, cy, csx, csy);
                double dep = safeDep(cx, cy, csx, csy, ct);
                if (dep > ct + 1e-9) {
                    Json::Value wt;
                    wt["x"] = cx; wt["y"] = cy; wt["t"] = dep; wt["action"] = "WAIT";
                    dpaths[bd].append(wt); ct = dep;
                }
                double eToS = dToS * (1.0 + pl);
                bat -= eToS; ct += dToS; cx = csx; cy = csy;

                Json::Value ch;
                ch["x"] = csx; ch["y"] = csy; ch["t"] = ct; ch["action"] = "CHARGE";
                dpaths[bd].append(ch);

                double dSW = eDist(csx, csy, warehouseX, warehouseY);
                double eSW = dSW * 1.0;
                double need = eSW - bat;
                if (need > 0) { double chT = need / 2.0; bat += chT * 2.0; ct += chT; }
                if (bat > 500) bat = 500;

                Json::Value cc;
                cc["x"] = csx; cc["y"] = csy; cc["t"] = ct; cc["action"] = "CHARGE_COMPLETE";
                dpaths[bd].append(cc);

                dep = safeDep(cx, cy, warehouseX, warehouseY, ct);
                if (dep > ct + 1e-9) {
                    Json::Value wt;
                    wt["x"] = cx; wt["y"] = cy; wt["t"] = dep; wt["action"] = "WAIT";
                    dpaths[bd].append(wt); ct = dep;
                }
                bat -= eSW; ct += dSW;
            } else {
                double dep = safeDep(cx, cy, warehouseX, warehouseY, ct);
                if (dep > ct + 1e-9) ct = dep;
                ct += dBack;
            }
        } else {
            double dep = safeDep(cx, cy, warehouseX, warehouseY, ct);
            if (dep > ct + 1e-9) {
                Json::Value wt;
                wt["x"] = cx; wt["y"] = cy; wt["t"] = dep; wt["action"] = "WAIT";
                dpaths[bd].append(wt); ct = dep;
            }
            bat -= eBack; ct += dBack;
        }

        Json::Value rt;
        rt["x"] = warehouseX; rt["y"] = warehouseY; rt["t"] = ct; rt["action"] = "RETURN";
        dpaths[bd].append(rt);
        droneAvail[bd] = ct;
    }

    for (int i = 0; i < nDrn; i++) {
        if (dpaths[i].size() > 0) {
            Json::Value entry;
            entry["drone_id"] = drones[i]["id"].asString();
            entry["path"] = dpaths[i];
            flight_manifest.append(entry);
        }
    }

// End of BODY

// Start of TAIL
    Json::Value output;
    output["flight_manifest"] = flight_manifest;
    Json::StreamWriterBuilder wb;
    wb["indentation"] = "";
    cout << Json::writeString(wb, output) << endl;
    return 0;
}
// End of TAIL
