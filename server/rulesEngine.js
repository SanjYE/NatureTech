// server/rulesEngine.js

// Reference Thresholds
const THRESHOLDS = {
    Temperature: { HIGH: 35, MID_LOW: 20, MID_HIGH: 30 },
    Moisture: { LOW: 20, HIGH: 80, OPTIMAL_LOW: 40, OPTIMAL_HIGH: 70 }, // Air Humidity
    SoilMoisture: { LOW: 10, HIGH: 90, OPTIMAL_LOW: 30, OPTIMAL_HIGH: 60, CRITICAL_LOW: 10, CRITICAL_HIGH: 90 },
    
    // New Metrics for Advanced Rules (Default placeholders if not provided)
    Rainfall: { LOW: 10, MID: 30, HIGH: 100 }, // mm/month or similar unit
    ET: { HIGH: 50 }, // Evapotranspiration (mm)
    EC: { HIGH: 4.0 }, // Electrical Conductivity (dS/m) -> Salinity High
    ESP: { MID: 6, HIGH: 15 }, // Exchangeable Sodium Percentage -> Sodicity
    BulkDensity: { MID: 1.4, HIGH: 1.6 } // g/cm3
};

/**
 * Evaluates rules against a single observation record.
 * @param {Object} obs - The observation data object.
 * @returns {Object} - { alerts: [], recommendations: [] }
 */
function evaluateRules(obs) {
    const alerts = [];
    const recommendations = [];

    // Helper to safely get numbers (default to 0 to avoid NaN)
    const getVal = (key) => {
        const val = parseFloat(obs[key]);
        return isNaN(val) ? 0 : val; // Treat missing technical data as 0 safe default
    };
    
    // Helper to get booleans
    const getBool = (key) => obs[key] === 1 || obs[key] === true || obs[key] === 'Yes';

    // Core Inputs (From Form)
    const temp = getVal('temperature');
    const humidity = getVal('moisture'); // Air Moisture
    const soilMoisture = getVal('soilMoisture');
    const visiblePests = getBool('visiblePests');
    const ec = getVal('electricalConductivity');
    const ph = getVal('pHValue');

    // Advanced Inputs (Potentially missing in current form, mapped or defaulted)
    const rainfall = getVal('rainfall'); 
    const et = getVal('et'); // Evapotranspiration
    const esp = getVal('esp'); // Sodicity
    const bulkDensity = getVal('bulkDensity');
    const slope = obs['slope'] || 'Flat'; // 'Steep', 'Moderate', 'Flat'
    const fireFlag = getBool('fireFlag'); // Manual override

    // --- 1. FIRE RISK ---
    // ALARM: Fire Flag OR (Temp > High AND Humidity < Low)
    if (fireFlag || (temp > THRESHOLDS.Temperature.HIGH && humidity < THRESHOLDS.Moisture.LOW && humidity > 0)) {
        alerts.push({
            type: 'Fire Risk',
            severity: 'High',
            message: `CRITICAL FIRE RISK! Extrememly high temperature (${temp}°C) and low humidity (${humidity}%).`
        });
    } 
    // WARNING: At least 2 of: Temp>High, Hum<Low, Rain<Low, ET>High, Soil<Low
    else {
        let riskFactors = 0;
        if (temp > THRESHOLDS.Temperature.HIGH) riskFactors++;
        if (humidity < THRESHOLDS.Moisture.LOW && humidity > 0) riskFactors++;
        if (rainfall < THRESHOLDS.Rainfall.LOW) riskFactors++; // likely true if missing
        if (et > THRESHOLDS.ET.HIGH) riskFactors++;
        if (soilMoisture < THRESHOLDS.SoilMoisture.LOW && soilMoisture > 0) riskFactors++;

        if (riskFactors >= 2) {
            alerts.push({
                type: 'Fire Risk',
                severity: 'Medium',
                message: `Elevated Fire Risk. ${riskFactors} risk factors detected (High Temp, Low Moisture, etc).`
            });
        }
    }

    // --- 2. DROUGHT RISK ---
    // ALARM: Soil < Low OR (Rain < Low AND ET > High)
    const droughtAlarmCondition = (soilMoisture < THRESHOLDS.SoilMoisture.LOW && soilMoisture > 0) || 
                                  (rainfall < THRESHOLDS.Rainfall.LOW && et > THRESHOLDS.ET.HIGH && et > 0);

    if (droughtAlarmCondition) {
        alerts.push({
            type: 'Drought Risk',
            severity: 'High',
            message: `CRITICAL DROUGHT! Soil moisture is critically low (${soilMoisture}%) or water deficit is high.`
        });
    }
    // WARNING: At least 2 of: Rain < Low, Soil < Low, ET > High
    else {
        let droughtFactors = 0;
        if (rainfall < THRESHOLDS.Rainfall.LOW) droughtFactors++;
        if (soilMoisture < THRESHOLDS.SoilMoisture.LOW && soilMoisture > 0) droughtFactors++;
        if (et > THRESHOLDS.ET.HIGH) droughtFactors++;

        if (droughtFactors >= 2) {
            alerts.push({
                type: 'Drought Risk',
                severity: 'Medium',
                message: `Drought Warning. Multiple water deficit indicators detected.`
            });
        }
    }

    // --- 3. FLOOD RISK ---
    // ALARM: Rain > High OR Soil > High
    if (rainfall > THRESHOLDS.Rainfall.HIGH || soilMoisture > THRESHOLDS.SoilMoisture.CRITICAL_HIGH) {
         alerts.push({
            type: 'Flood Risk',
            severity: 'High',
            message: `FLOOD ALERT! Soil is saturated (${soilMoisture}%) or heavy rainfall detected.`
        });
    }
    // WARNING: Rain > High AND Soil > High (Note: Covered by OR above, but implemented for strict adherence if logic changes)
    // Since Alarm takes precedence and OR covers AND, the Elsevier logic implies 'Warning' is a subset. 
    // We will skip explicit Warning here to avoid double alert, as Alarm is already fired.


    // --- 4. SOIL EROSION RISK ---
    // ALARM: Rain > High AND Slope Steep AND (BulkDensity > High OR ESP > High)
    const erosionAlarm = (rainfall > THRESHOLDS.Rainfall.HIGH) && 
                         (slope === 'Steep') && 
                         (bulkDensity > THRESHOLDS.BulkDensity.HIGH || esp > THRESHOLDS.ESP.HIGH);
    
    if (erosionAlarm) {
        alerts.push({
            type: 'Erosion Risk',
            severity: 'High',
            message: `SEVERE EROSION RISK! Heavy rain on steep slope with poor soil structure.`
        });
    } 
    // WARNING: Rain > Mid AND Slope Moderate AND (BulkDensity > Mid OR ESP > Mid)
    else if (rainfall > THRESHOLDS.Rainfall.MID && slope === 'Moderate' && (bulkDensity > THRESHOLDS.BulkDensity.MID || esp > THRESHOLDS.ESP.MID)) {
        alerts.push({
            type: 'Erosion Risk',
            severity: 'Medium',
            message: `Erosion Warning. Moderate slope and rainfall pose risk to soil stability.`
        });
    }

    // --- 5. SALINITY & SODICITY RISK ---
    // Salinity ALARM (EC)
    if (ec > THRESHOLDS.EC.HIGH) {
        alerts.push({
            type: 'Salinity Risk',
            severity: 'High',
            message: `High Salinity! EC value (${ec} dS/m) exceeds critical threshold.`
        });
    } else if (ec > (THRESHOLDS.EC.HIGH * 0.9)) {
        alerts.push({
            type: 'Salinity Risk',
            severity: 'Medium',
            message: `Salinity Warning. EC value (${ec} dS/m) is approaching critical levels.`
        });
    }

    // Sodicity ALARM (ESP)
    const sodicityAlarm = esp > THRESHOLDS.ESP.HIGH;
    if (sodicityAlarm) {
        alerts.push({
            type: 'Sodicity Risk',
            severity: 'High',
            message: `High Sodicity! ESP (${esp}%) indicates potential soil structure breakdown.`
        });
    } else {
        // Warning: ESP near high OR (ESP > Mid + Bulk Density Stress)
        const sodicityWarning = (esp > (THRESHOLDS.ESP.HIGH * 0.9)) || 
                                (esp > THRESHOLDS.ESP.MID && bulkDensity > THRESHOLDS.BulkDensity.HIGH);
        if (sodicityWarning) {
            alerts.push({
                type: 'Sodicity Risk',
                severity: 'Medium',
                message: `Sodicity Warning. Soil sodium levels are elevated.`
            });
        }
    }

    // --- 6. PEST RISK ---
    // ALARM: Visible Pests
    if (visiblePests) {
        alerts.push({
            type: 'Pest Outbreak',
            severity: 'High', // Upgraded to High per new requirements for 'Visible'
            message: `Active Pest Outbreak reported!`
        });
    } 
    // WARNING: Favorable Conditions (High Temp + High Humidity)
    else if (temp > THRESHOLDS.Temperature.MID_HIGH && humidity > THRESHOLDS.Moisture.OPTIMAL_HIGH) {
        alerts.push({
            type: 'Pest Outbreak',
            severity: 'Medium',
            message: `Pest Warning. Warm and humid conditions (${temp}°C, ${humidity}%) favor pest proliferation.`
        });
    }

    // --- RECOMMENDATIONS (UNCHANGED logic for now, confirming if updates needed?) ---
    // Keeping existing logic plus defaults

    // 1. Water Use Efficiency (Yield Opt)
    // Trigger: High Temp + Mid Soil Moisture (Good time to optimize)
    if (temp >= 30 && soilMoisture >= 30 && soilMoisture <= 60) {
        recommendations.push({
            title: 'Improve Water Use Efficiency',
            body: `Conditions are warm (${temp}°C) with moderate soil moisture. Consider mulching or shading to reduce evaporation and improve yield.`,
            priority: 'Medium'
        });
    }

    // 2. ROI Water (Cost Opt)
    // Trigger: Over-watering 
    if (soilMoisture > THRESHOLDS.SoilMoisture.OPTIMAL_HIGH && soilMoisture < 90) {
        recommendations.push({
            title: 'Reduce Irrigation Frequency',
            body: `Soil moisture is high (${soilMoisture}%). Reducing irrigation will cut water costs without impacting yield.`,
            priority: 'High'
        });
    }
    
    // 3. Salinity Management (New)
    if (ec > THRESHOLDS.EC.HIGH) {
        recommendations.push({
            title: 'Manage Salinity',
            body: `EC is high. Ensure proper drainage and consider leaching salts with fresh water if available.`,
            priority: 'High'
        });
    }

    return { alerts, recommendations };
}

module.exports = { evaluateRules };
