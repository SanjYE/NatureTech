const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { evaluateRules } = require('./rulesEngine');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Root Route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// One-time Schema Migration for Recommendations
const migrateSchema = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE recommendations 
      ADD COLUMN IF NOT EXISTS observation_id UUID REFERENCES observations(observation_id);
    `);
    console.log('Schema migration: ensure recommendations has observation_id -> OK');
  } catch (err) {
    console.error('Schema migration failed:', err);
  } finally {
    client.release();
  }
};
migrateSchema();

// Test DB connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      return console.error('Error executing query', err.stack);
    }
    console.log('Connected to Database:', result.rows[0]);
  });
});

// Routes

// Sign Up Route
app.post('/signup', async (req, res) => {
  console.log('Received signup request:', req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    console.log('Missing email or password');
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Check if user already exists
    console.log('Checking if user exists...');
    const userCheck = await pool.query('SELECT * FROM profiles WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      console.log('User already exists');
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    console.log('Hashing password...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate UUID
    const userId = uuidv4();

    // Insert into profiles
    console.log('Inserting user into database...');
    const query = `
      INSERT INTO profiles (user_id, email, password, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING user_id, email, created_at
    `;
    
    const values = [userId, email, hashedPassword];
    
    const result = await pool.query(query, values);
    console.log('User created successfully:', result.rows[0]);

    res.status(201).json({
      message: 'User created successfully',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Error in signup:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  console.log('Received login request:', req.body.email);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Check if user exists
    const result = await pool.query('SELECT * FROM profiles WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Login successful
    console.log('Login successful for:', email);
    
    // Fetch organisation details (Role, OrgID)
    const membershipResult = await pool.query(
      'SELECT organisation_id, role FROM organisation_memberships WHERE user_id = $1', 
      [user.user_id]
    );
    
    const membership = membershipResult.rows[0] || {};
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: {
        ...userWithoutPassword,
        role: membership.role || 'farmer', // Default to farmer if no membership found
        organisationId: membership.organisation_id
      }
    });

  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete Profile Route
app.post('/complete-profile', async (req, res) => {
  const { userId, firstName, lastName, phone, orgName, orgType, country, role } = req.body;

  if (!userId || !firstName || !lastName || !orgName || !orgType || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Update Profile
    const fullName = `${firstName} ${lastName}`;
    const updateProfileQuery = `
      UPDATE profiles 
      SET full_name = $1, phone = $2 
      WHERE user_id = $3
      RETURNING *
    `;
    await client.query(updateProfileQuery, [fullName, phone, userId]);

    // 2. Organisation Handling
    // Logic: 
    // - Check if org with this name already exists.
    // - If YES: Add user to it (if not already member).
    // - If NO: Create new org and add user.
    
    let orgId;
    
    // Check for existing organisation by name (case-insensitive and trimmed)
    const existingOrgRes = await client.query(
      'SELECT organisation_id FROM organisations WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))',
      [orgName]
    );

    if (existingOrgRes.rows.length > 0) {
      // Org exists
      orgId = existingOrgRes.rows[0].organisation_id;
      console.log(`User joining existing org: ${orgId}`);
    } else {
      // Create new org
      const createOrgQuery = `
        INSERT INTO organisations (name, org_type, country_code)
        VALUES ($1, $2, $3)
        RETURNING organisation_id
      `;
      const orgResult = await client.query(createOrgQuery, [orgName, orgType, country]);
      orgId = orgResult.rows[0].organisation_id;
      console.log(`User created new org: ${orgId}`);
    }

    // 3. Create Organisation Membership
    // Check if membership exists first to avoid duplicate key errors
    const existingMem = await client.query(
      'SELECT organisation_id FROM organisation_memberships WHERE organisation_id = $1 AND user_id = $2',
      [orgId, userId]
    );

    if (existingMem.rows.length === 0) {
      const createMembershipQuery = `
        INSERT INTO organisation_memberships (organisation_id, user_id, role)
        VALUES ($1, $2, $3)
      `;
      await client.query(createMembershipQuery, [orgId, userId, role]);
    } else {
        // Update role if they are re-completing profile?
        // For now, let's just update the role just in case
        await client.query(
            'UPDATE organisation_memberships SET role = $1 WHERE organisation_id = $2 AND user_id = $3',
            [role, orgId, userId]
        );
    }

    await client.query('COMMIT');

    // Fetch updated user data to return
    const updatedUserResult = await client.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
    const { password: _, ...updatedUser } = updatedUserResult.rows[0];

    res.json({
      message: 'Profile completed successfully',
      user: updatedUser,
      organisationId: orgId
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in complete-profile:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  } finally {
    client.release();
  }
});

// Get Sites (Filtered by Organisation)
app.get('/sites', async (req, res) => {
  const { organisationId } = req.query;
  try {
    if (!organisationId) {
        return res.status(400).json({ error: 'Missing organisationId' });
    }
    const result = await pool.query('SELECT * FROM sites WHERE organisation_id = $1', [organisationId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Site Route
app.post('/sites', async (req, res) => {
  console.log('Received create site request:', req.body);
  const { 
    userId, 
    name, 
    siteCode,
    siteType, 
    countryCode, 
    adminArea, 
    latitude, 
    longitude, 
    geom, 
    elevation_m, 
    area_ha,
    // Additional JSON data
    location,
    operations,
    resources,
    infrastructure,
    support
  } = req.body;

  if (!userId || !name || !siteCode || !siteType || !latitude || !longitude) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = await pool.connect();

  try {
    // 1. Get Organisation ID for the user
    // Assuming user belongs to one organisation for now, or we pick the first one
    const orgQuery = `
      SELECT organisation_id 
      FROM organisation_memberships 
      WHERE user_id = $1 
      LIMIT 1
    `;
    const orgResult = await client.query(orgQuery, [userId]);
    
    if (orgResult.rows.length === 0) {
      return res.status(400).json({ error: 'User does not belong to an organisation' });
    }
    
    const organisationId = orgResult.rows[0].organisation_id;

    // 2. Insert Site
    // Note: We are storing the additional form data (location, operations, etc.) 
    // either in separate columns if they exist, or we could store them in a JSONB column if the schema supported it.
    // The current schema for 'sites' table (from DATABASE_STATUS.md) has:
    // site_id, organisation_id, name, site_type, country_code, admin_area, latitude, longitude, geom, elevation_m, area_ha, created_at, updated_at
    // It does NOT have columns for 'operations', 'resources', etc.
    // For now, we will insert the core fields. 
    // If you want to store the extra data, we might need to add a 'details' JSONB column to the sites table or create a separate table.
    // Given the instructions "I think all these fields can now be filled up", I will map what fits.
    
    // Construct geometry string for PostGIS if geom is provided
    // geom is likely a GeoJSON object from the frontend. PostGIS needs ST_GeomFromGeoJSON
    let geomValue = null;
    let geomPlaceholder = 'NULL';
    
    if (geom) {
      try {
        const parsedGeom = typeof geom === 'string' ? JSON.parse(geom) : geom;
        let targetGeometry = parsedGeom;

        // If it's a FeatureCollection, try to find a Polygon/MultiPolygon first, then a Point
        if (parsedGeom.type === 'FeatureCollection' && Array.isArray(parsedGeom.features)) {
          const polygonFeature = parsedGeom.features.find(f => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon');
          if (polygonFeature) {
            targetGeometry = polygonFeature.geometry;
          } else {
            // Fallback to the first feature's geometry if no polygon found
            const firstFeature = parsedGeom.features[0];
            if (firstFeature && firstFeature.geometry) {
              targetGeometry = firstFeature.geometry;
            }
          }
        } 
        // If it's a Feature, extract geometry
        else if (parsedGeom.type === 'Feature' && parsedGeom.geometry) {
          targetGeometry = parsedGeom.geometry;
        }

        // Re-stringify for the query
        geomValue = JSON.stringify(targetGeometry);
        geomPlaceholder = "ST_SetSRID(ST_GeomFromGeoJSON($11), 4326)";
      } catch (e) {
        console.error('Error parsing GeoJSON:', e);
        // Fallback to original behavior if parsing fails, though it might error in DB
        geomValue = geom;
        geomPlaceholder = "ST_SetSRID(ST_GeomFromGeoJSON($11), 4326)";
      }
    }

    const insertSiteQuery = `
      INSERT INTO sites (
        organisation_id, 
        name, 
        site_code,
        site_type, 
        country_code, 
        admin_area, 
        latitude, 
        longitude, 
        elevation_m, 
        area_ha, 
        geom,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, ${geomPlaceholder}, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      organisationId,
      name,
      siteCode,
      siteType,
      countryCode,
      adminArea,
      latitude,
      longitude,
      elevation_m,
      area_ha,
      // $11 is geomValue if it exists
    ];

    if (geomValue) {
      values.push(geomValue);
    }

    const siteResult = await client.query(insertSiteQuery, values);
    
    console.log('Site created successfully:', siteResult.rows[0]);

    res.status(201).json({
      message: 'Site created successfully',
      site: siteResult.rows[0]
    });

  } catch (error) {
    console.error('Error in create site:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  } finally {
    client.release();
  }
});

// Create Site Unit Route
app.post('/site-units', async (req, res) => {
  console.log('Received create site unit request:', req.body);
  const { siteId, name, unitType, geom, area_ha } = req.body;

  if (!siteId || !name || !unitType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = await pool.connect();

  try {
    // Construct geometry string for PostGIS
    let geomValue = null;
    let geomPlaceholder = 'NULL';

    if (geom) {
      try {
        // geom is expected to be a GeoJSON Polygon
        const parsedGeom = typeof geom === 'string' ? JSON.parse(geom) : geom;
        let targetGeometry = parsedGeom;

        // Handle Feature wrapper
        if (parsedGeom.type === 'Feature') {
            targetGeometry = parsedGeom.geometry;
        }

        // Validate type
        if (targetGeometry.type !== 'Polygon' && targetGeometry.type !== 'MultiPolygon') {
             console.warn('Invalid geometry type for site unit:', targetGeometry.type);
        }
        
        geomValue = JSON.stringify(targetGeometry);
        geomPlaceholder = "ST_SetSRID(ST_GeomFromGeoJSON($5), 4326)";
        
      } catch (e) {
        console.error('Error parsing GeoJSON:', e);
      }
    }

    const query = `
      INSERT INTO site_units (
        site_id,
        name,
        unit_type,
        area_ha,
        geom,
        created_at
      )
      VALUES ($1, $2, $3, $4, ${geomPlaceholder}, NOW())
      RETURNING *
    `;

    const values = [siteId, name, unitType, area_ha];
    if (geomValue) {
      values.push(geomValue);
    }

    const result = await client.query(query, values);
    console.log('Site unit created:', result.rows[0]);

    res.status(201).json({
      message: 'Site unit created successfully',
      siteUnit: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating site unit:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  } finally {
    client.release();
  }
});

// Create Observation Route
app.post('/observations', async (req, res) => {
  console.log('Received observation request:', req.body);
  const { 
    barcode, 
    // Manual Input Fields
    manualSiteCode,
    manualBlockId,
    manualGridNum,
    manualRowNum,
    manualPlantNum,
    manualSpeciesCode,
    
    submittedBy, 
    submittedOn, 
    gps, 
    spotsOnLeaves, 
    yellowLeaves, 
    droopingLeaves, 
    visiblePests, 
    recentPestDamage, 
    typeOfPest, 
    notes,
    diameterAtBase,
    // New fields
    // rowType removed from body, calculated server-side
    berryType,
    fixerName,
    oldBambooNumberofculms,
    oldBambooMarkercolour,
    oldBambooDiameteratbase,
    oldBambooCulmheight,
    newBambooShoots,
    newBambooMarkercolour,
    newBambooShootheight,
    fruitHeight,
    fruitDiameter,
    fruitNumberofbranches,
    fruitNumberofflowerclusters,
    fruitNumberoffruit,
    sufficientMulch,
    sufficientCompostManure,
    soilMoisture,
    electricalConductivity,
    pHValue,
    temperature,
    moisture,
    transectLineName,
    // Advanced Environmental
    rainfall,
    et,
    slope,
    bulkDensity,
    esp
  } = req.body;

  // Validation: Either Barcode OR Manual Fields must be fully present
  const isBarcodeProvided = barcode && barcode.length >= 13;
  const isManualProvided = manualSiteCode && manualBlockId && manualGridNum && manualRowNum && manualPlantNum && manualSpeciesCode;

  if (!isBarcodeProvided && !isManualProvided) {
    return res.status(400).json({ error: 'Either a valid Barcode OR all Manual Identity fields (Farm ID, Block, Grid, Row, Plant, Species) are required.' });
  }

  if (!submittedBy) {
    return res.status(400).json({ error: 'Missing required field: submittedBy' });
  }

  const client = await pool.connect();

  try {
    let siteCode, blockId, gridNum, rowNum, plantNum, speciesCode;

    if (isBarcodeProvided) {
        // Parse Barcode
        // Format: Z1A3017032011
        siteCode = barcode.substring(0, 2);
        blockId = barcode.substring(2, 3);
        gridNum = barcode.substring(3, 5);
        rowNum = barcode.substring(5, 7);
        plantNum = barcode.substring(7, 10);
        speciesCode = barcode.substring(10, 13);
    } else {
        // Use Manual Inputs
        siteCode = manualSiteCode;
        blockId = manualBlockId;
        gridNum = manualGridNum;
        rowNum = manualRowNum;
        plantNum = manualPlantNum;
        speciesCode = manualSpeciesCode;
    }

    // 2. Lookup Site ID
    const siteQuery = 'SELECT site_id FROM sites WHERE site_code = $1';
    const siteResult = await client.query(siteQuery, [siteCode]);

    if (siteResult.rows.length === 0) {
        return res.status(404).json({ error: `Site with code ${siteCode} not found` });
    }
    const siteId = siteResult.rows[0].site_id;

    // 3. Lookup Plant Type
    const cropQuery = 'SELECT plant_type_name FROM crops WHERE species_code = $1';
    const cropResult = await client.query(cropQuery, [speciesCode]);
    
    let plantType = 'Unknown';
    if (cropResult.rows.length > 0) {
        plantType = cropResult.rows[0].plant_type_name;
    }

    // Calculate Row Type based on Plant Type
    let rowType = 'fruit'; // Default
    const lowerPlantType = (plantType || '').toLowerCase();
    
    if (['tc balcooa', 'big bamboo'].includes(lowerPlantType)) {
        rowType = 'bamboo';
    } else if (['nitrogen fixer', 'other'].includes(lowerPlantType)) {
        rowType = 'other';
    }

    const insertQuery = `
      INSERT INTO observations (
        site_id,
        "SubmittedBy",
        "SubmittedOn",
        "LocationGPS",
        "Plantationarea",
        "Areablocknumber",
        "Rownumber",
        "Plantnumber",
        "Planttype",
        "Spotsonleaves",
        "Yellowleaves",
        "Droppingdryordroopingleaves",
        "Visiblepests",
        "Recentpestdamage",
        "Typeofpests",
        "Additionalcomments",
        "FormName",
        "FormVersion",
        "DataYear",
        "Rowtype",
        "Berrytype",
        "Fixername",
        "oldBambooNumberofculms",
        "oldBambooMarkercolour",
        "oldBambooDiameteratbase",
        "oldBambooCulmheight",
        "newBambooShoots",
        "newBambooMarkercolour",
        "newBambooShootheight",
        "fruitHeight",
        "fruitDiameter",
        "fruitNumberofbranches",
        "fruitNumberofflowerclusters",
        "fruitNumberoffruit",
        "Sufficientmulch",
        "Sufficientcompostmanure",
        "Soilmoisture",
        "Electricalconductivity",
        "pHvalue",
        "Temperature",
        "Moisture",
        "TransectLineName",
        "Rainfall",
        "ET",
        "Slope",
        "BulkDensity",
        "ESP"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47)
      RETURNING observation_id
    `;

    const locationGPS = gps ? `${gps.lat},${gps.lon}` : null;
    // lat and lon columns removed from schema

    // Helper to convert Yes/No/N/A to 1/0/-1 or similar if needed. 
    // The schema has INTEGER for these fields. 
    // Assuming frontend sends "Yes"/"No". 
    // Let's map: Yes -> 1, No -> 0, N/A -> -1 (or NULL)
    const mapBool = (val) => {
        if (val === 'Yes') return 1;
        if (val === 'No') return 0;
        return null;
    };

    const values = [
        siteId,
        submittedBy,
        submittedOn,
        locationGPS,
        blockId, // Plantationarea
        gridNum, // Areablocknumber
        parseFloat(rowNum), // Rownumber
        parseFloat(plantNum), // Plantnumber
        plantType,
        mapBool(spotsOnLeaves),
        mapBool(yellowLeaves),
        mapBool(droopingLeaves),
        mapBool(visiblePests),
        mapBool(recentPestDamage),
        typeOfPest,
        notes,
        'Plant health monitoring', // FormName
        8, // FormVersion
        2026, // DataYear
        rowType,
        berryType,
        fixerName,
        oldBambooNumberofculms ? parseFloat(oldBambooNumberofculms) : null,
        oldBambooMarkercolour,
        oldBambooDiameteratbase ? parseFloat(oldBambooDiameteratbase) : null,
        oldBambooCulmheight ? parseFloat(oldBambooCulmheight) : null,
        newBambooShoots ? parseFloat(newBambooShoots) : null,
        newBambooMarkercolour,
        newBambooShootheight ? parseFloat(newBambooShootheight) : null,
        fruitHeight ? parseFloat(fruitHeight) : null,
        fruitDiameter ? parseFloat(fruitDiameter) : null,
        fruitNumberofbranches ? parseFloat(fruitNumberofbranches) : null,
        fruitNumberofflowerclusters ? parseFloat(fruitNumberofflowerclusters) : null,
        fruitNumberoffruit ? parseFloat(fruitNumberoffruit) : null,
        mapBool(sufficientMulch),
        mapBool(sufficientCompostManure),
        soilMoisture ? parseFloat(soilMoisture) : null,
        electricalConductivity ? parseFloat(electricalConductivity) : null,
        pHValue ? parseFloat(pHValue) : null,
        temperature ? parseFloat(temperature) : null,
        moisture ? parseFloat(moisture) : null,
        transectLineName,
        rainfall ? parseFloat(rainfall) : null,
        et ? parseFloat(et) : null,
        slope,
        bulkDensity ? parseFloat(bulkDensity) : null,
        esp ? parseFloat(esp) : null
    ];

    const result = await client.query(insertQuery, values);
    const observationId = result.rows[0].observation_id;
    console.log('Observation created:', observationId);

    // --- ALERT PERSISTENCE LOGIC ---
    // Fetch the most recent previous observation for this Block (Plantationarea) to fill missing environmental data
    const latestObsQuery = `
        SELECT "Temperature", "Moisture", "Soilmoisture", "Electricalconductivity", "pHvalue", "Rainfall", "ET", "Slope", "BulkDensity", "ESP"
        FROM observations
        WHERE site_id = $1 AND "Areablocknumber" = $2 AND observation_id != $3
        ORDER BY "SubmittedOn" DESC
        LIMIT 1
    `;
    const latestResult = await client.query(latestObsQuery, [siteId, gridNum, observationId]);
    const previousData = latestResult.rows[0] || {};

    // Create a merged data object for the Rules Engine
    // If the current submission is missing a value (is undefined, null, or empty string), try to use the previous value
    const mergedData = { ...req.body };

    const mergeField = (bodyKey, dbKey) => {
        const currentVal = mergedData[bodyKey];
        // Check if "empty": undefined, null, or empty string.
        // We handle '0' carefully: typically 0 is a valid measurement, but if sent as empty string it becomes 0 later.
        // req.body values are typically strings from FormData.
        const isEmpty = (currentVal === undefined) || (currentVal === null) || (currentVal === '') || (typeof currentVal === 'string' && currentVal.trim() === '');
        
        if (isEmpty && previousData[dbKey] !== undefined && previousData[dbKey] !== null) {
            mergedData[bodyKey] = previousData[dbKey];
            console.log(`[Rules Persistence] Using previous value for ${bodyKey}: ${previousData[dbKey]}`);
        }
    };

    mergeField('temperature', 'Temperature');
    mergeField('moisture', 'Moisture');
    mergeField('soilMoisture', 'Soilmoisture');
    mergeField('electricalConductivity', 'Electricalconductivity');
    mergeField('pHValue', 'pHvalue');
    mergeField('rainfall', 'Rainfall');
    mergeField('et', 'ET');
    mergeField('slope', 'Slope');
    mergeField('bulkDensity', 'BulkDensity');
    mergeField('esp', 'ESP');

    // --- RULES ENGINE EXECUTION ---
    try {
        const rulesResult = evaluateRules(mergedData);
        
        // Insert Alerts
        for (const alert of rulesResult.alerts) {
            await client.query(`
                INSERT INTO alerts (site_id, observation_id, alert_type, severity, message)
                VALUES ($1, $2, $3, $4, $5)
            `, [siteId, observationId, alert.type, alert.severity, alert.message]);
        }

        // Insert Recommendations
        for (const rec of rulesResult.recommendations) {
            await client.query(`
                INSERT INTO recommendations (site_id, observation_id, title, body, priority)
                VALUES ($1, $2, $3, $4, $5)
            `, [siteId, observationId, rec.title, rec.body, rec.priority]);
        }
        console.log(`Rules Engine: Generated ${rulesResult.alerts.length} alerts and ${rulesResult.recommendations.length} recommendations.`);

        // --- NEW: Auto-Resolve Logic (Block Scoped) ---
        // A. ALERTS
        // 1. Define all possible environmental risks that are "stateful" for a block.
        const allRiskTypes = [
            'Fire Risk', 
            'Drought Risk', 
            'Flood Risk', 
            'Pest Outbreak',
            'Erosion Risk',
            'Salinity Risk',
            'Sodicity Risk'
        ];

        // 2. Identify which risks were TRIPPED in this current observation
        const triggeredRisks = new Set(rulesResult.alerts.map(a => a.type));

        // 3. Identify which risks are NOT triggered (i.e., are now "Safe")
        const safeRisks = allRiskTypes.filter(type => !triggeredRisks.has(type));

        if (safeRisks.length > 0) {
           // ... (Existing alert resolution code) ...
           const resolveQuery = `
                UPDATE alerts
                SET status = 'resolved', acknowledged_at = NOW()
                FROM observations
                WHERE alerts.observation_id = observations.observation_id
                  AND alerts.site_id = $1
                  AND alerts.status = 'active'
                  AND observations."Plantationarea" = $2
                  AND alerts.alert_type = ANY($3)
            `;
            await client.query(resolveQuery, [siteId, blockId, safeRisks]);
        }

        // B. RECOMMENDATIONS
        // 1. Define typical optimization titles (stateful)
        const allRecTitles = [
            'Improve Water Use Efficiency', 
            'Reduce Irrigation Frequency',
            'Manage Salinity'
        ];

        // 2. Identify which recs were GENERATED this time
        const triggeredRecTitles = new Set(rulesResult.recommendations.map(r => r.title));

        // 3. Identify which recs are NOT triggered (i.e., condition no longer met)
        // We only resolve "known" titles. If a title isn't in 'allRecTitles', we ignore it (custom recs?)
        const resolvedRecTitles = allRecTitles.filter(t => !triggeredRecTitles.has(t));

        if (resolvedRecTitles.length > 0) {
             const resolveRecQuery = `
                UPDATE recommendations
                SET status = 'resolved'
                FROM observations
                WHERE recommendations.observation_id = observations.observation_id
                  AND recommendations.site_id = $1
                  AND recommendations.status = 'pending'
                  AND observations."Plantationarea" = $2
                  AND recommendations.title = ANY($3)
             `;
             await client.query(resolveRecQuery, [siteId, blockId, resolvedRecTitles]);
             console.log(`Auto-resolved recommendations for Block ${blockId}: ${resolvedRecTitles.join(', ')}`);
        }
        // ----------------------------------------------
    } catch (ruleError) {
        console.error('Error executing rules engine:', ruleError);
    }
    // -----------------------------

    res.status(201).json({
        message: 'Observation recorded successfully',
        observationId: observationId,
        parsedData: {
            siteCode,
            blockId,
            rowNum,
            plantNum,
            plantType
        }
    });

  } catch (error) {
    console.error('Error creating observation:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  } finally {
    // Only return PENDING (active) recommendations, matching existing Alerts behavior (conceptually)
    // or filter on frontend? Given the user wants "old recommendation gone", backend filtering is safer for now.
    // But user liked "History" for alerts. Let's return all and filter "pending" as primary view in frontend?
    // Actually, for recommendations, "history" is less useful than alerts. 
    // Let's return ALL, but the frontend will filter.
    // The user specifically asked: "when i updated... old recommendation is still there".
    // I will return all, but ensure I update the frontend to FILTER by status='pending'.
    
    client.release();
  }
});

// Get Alerts Route
app.get('/alerts', async (req, res) => {
  const { siteId } = req.query;
  try {
    let query = 'SELECT * FROM alerts ORDER BY created_at DESC';
    let params = [];
    if (siteId) {
      query = 'SELECT * FROM alerts WHERE site_id = $1 ORDER BY created_at DESC';
      params = [siteId];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Recommendations Route
app.get('/recommendations', async (req, res) => {
  const { siteId } = req.query;
  try {
    let query = 'SELECT * FROM recommendations ORDER BY created_at DESC';
    let params = [];
    if (siteId) {
      query = 'SELECT * FROM recommendations WHERE site_id = $1 ORDER BY created_at DESC';
      params = [siteId];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get TNFD Metrics Route
app.get('/tnfd-metrics', async (req, res) => {
  const { siteId } = req.query;
  try {
    let query = 'SELECT * FROM tnfd_metrics ORDER BY metric_name ASC';
    let params = [];
    if (siteId) {
      query = 'SELECT * FROM tnfd_metrics WHERE site_id = $1 ORDER BY metric_name ASC';
      params = [siteId];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching TNFD metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- TASK MANAGEMENT ROUTES ---

// Get Organisation Members
app.get('/organisation/:orgId/members', async (req, res) => {
  const { orgId } = req.params;
  try {
    const query = `
      SELECT p.user_id, p.full_name, om.role 
      FROM profiles p 
      JOIN organisation_memberships om ON p.user_id = om.user_id 
      WHERE om.organisation_id = $1
    `;
    const result = await pool.query(query, [orgId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Organisation Details
app.get('/organisations/:orgId', async (req, res) => {
  const { orgId } = req.params;
  try {
    const query = 'SELECT * FROM organisations WHERE organisation_id = $1';
    const result = await pool.query(query, [orgId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organisation not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching organisation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Profile Details
app.get('/profiles/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const query = 'SELECT user_id, full_name, email, phone, created_at FROM profiles WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Site Units
app.get('/site-units', async (req, res) => {
  const { siteId } = req.query;
  try {
    let query = 'SELECT * FROM site_units ORDER BY created_at DESC';
    let params = [];
    if (siteId) {
      query = 'SELECT * FROM site_units WHERE site_id = $1 ORDER BY created_at DESC';
      params = [siteId];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching site units:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Tasks
app.get('/tasks', async (req, res) => {
  const { userId, role, organisationId } = req.query;
  
  try {
    let query = '';
    let params = [];

    if (!userId) {
       return res.status(400).json({ error: 'Missing userId' });
    }

    if (['manager', 'admin', 'owner'].includes((role || '').toLowerCase())) {
        // Managers see tasks they created OR tasks assigned to them
        // Simplified query as per user request: Just check created_by or assigned_to matching the user.
        // We removed the organisation_id filter to ensure tasks appear even if org context is missing.
        query = `
            SELECT t.*, 
                assignee.full_name as assigned_to_name,
                creator.full_name as created_by_name
            FROM tasks t
            LEFT JOIN profiles assignee ON t.assigned_to = assignee.user_id
            LEFT JOIN profiles creator ON t.created_by = creator.user_id
            WHERE t.created_by = $1 OR t.assigned_to = $1
            ORDER BY t.created_at DESC
        `;
        params = [userId];
    } else {
        // Farmers see all tasks assigned to them (Pending & Completed)
        // We removed the status != 'completed' filter so they can view their history and toggle status
        query = `
            SELECT t.*, 
                creator.full_name as created_by_name
            FROM tasks t
            LEFT JOIN profiles creator ON t.created_by = creator.user_id
            WHERE t.assigned_to = $1 
            ORDER BY t.created_at DESC
        `;
        params = [userId];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Task
app.post('/tasks', async (req, res) => {
    const { organisationId, createdBy, assignedTo, title, description, priority, dueDate } = req.body;
    
    try {
        const query = `
            INSERT INTO tasks (organisation_id, created_by, assigned_to, title, description, priority, due_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const result = await pool.query(query, [organisationId, createdBy, assignedTo, title, description, priority, dueDate]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update Task Status
app.patch('/tasks/:taskId', async (req, res) => {
    const { taskId } = req.params;
    const { status } = req.body;

    try {
        let query = 'UPDATE tasks SET status = $1 WHERE task_id = $2 RETURNING *';
        let params = [status, taskId];

        if (status === 'completed') {
            query = 'UPDATE tasks SET status = $1, completed_at = NOW() WHERE task_id = $2 RETURNING *';
        }

        const result = await pool.query(query, params);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- SENSORS ROUTES ---

// Get Sensors
app.get('/sensors', async (req, res) => {
  const { organisationId } = req.query;
  try {
    if (!organisationId) {
      return res.status(400).json({ error: 'Missing organisationId' });
    }
    const query = 'SELECT * FROM sensors WHERE organisation_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [organisationId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sensors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Sensor
app.post('/sensors', async (req, res) => {
  const { organisationId, siteId, sensorType, manufacturer, model, serialNumber, installedAt } = req.body;

  if (!organisationId || !sensorType || !serialNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const query = `
      INSERT INTO sensors (organisation_id, site_id, sensor_type, manufacturer, model, serial_number, installed_at, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
      RETURNING *
    `;
    const values = [organisationId, siteId || null, sensorType, manufacturer, model, serialNumber, installedAt];
    const result = await pool.query(query, values);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating sensor:', error);
    if (error.code === '23505') { // Unique violation
        return res.status(400).json({ error: 'Serial number already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update Sensor Status
app.patch('/sensors/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'active' or 'inactive'

  try {
    const query = 'UPDATE sensors SET status = $1 WHERE sensor_id = $2 RETURNING *';
    const result = await pool.query(query, [status, id]);
    
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Sensor not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating sensor status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
