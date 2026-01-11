-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Organisations Table
-- 1. Organisations Table
-- (Removed updated_at)
CREATE TABLE IF NOT EXISTS organisations (
    organisation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    org_type TEXT,
    country_code TEXT, -- Live DB uses text
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles Table (Users)
-- (Removed updated_at)
CREATE TABLE IF NOT EXISTS profiles (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Organisation Memberships Table
CREATE TABLE IF NOT EXISTS organisation_memberships (
    organisation_id UUID REFERENCES organisations(organisation_id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('Admin', 'Member', 'Viewer', 'Manager', 'Farmer', 'Owner')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (organisation_id, user_id)
);

-- 4. Sites Table
-- 4. Sites Table
CREATE TABLE IF NOT EXISTS sites (
    site_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID REFERENCES organisations(organisation_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    site_code VARCHAR(50),      -- Verified: Limited to 50 chars in DB
    site_type TEXT NOT NULL,    -- Verified: NOT NULL in DB
    country_code TEXT,          -- Verified: TEXT (not VARCHAR limit) in DB
    admin_area TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geom geometry(Geometry, 4326), 
    elevation_m DOUBLE PRECISION,
    area_ha DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Site Units Table
CREATE TABLE IF NOT EXISTS site_units (
    unit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(site_id) ON DELETE CASCADE,
    name TEXT,
    unit_type TEXT,
    geom geography(Polygon, 4326), -- CHANGED from geometry to geography
    area_ha DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Crops Lookup Table
CREATE TABLE IF NOT EXISTS crops (
    species_code VARCHAR(10) PRIMARY KEY,
    plant_type_name TEXT UNIQUE
);

-- 7. Observations Table (Field Data)
CREATE TABLE IF NOT EXISTS observations (
    -- KEY IDENTIFIERS
    observation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(site_id),
    "Id" INTEGER,  -- Exists in DB
    "SubmissionId" TEXT,

    -- FORM METADATA
    "FormName" TEXT,
    "FormVersion" INTEGER,
    "SubmittedBy" TEXT,
    "SubmittedOn" TIMESTAMP,
    "DataYear" INTEGER DEFAULT 2026,

    -- LOCATION & IDENTITY
    "LocationGPS" TEXT,
    "LocationGPSLatitude" NUMERIC,
    "LocationGPSLongitude" NUMERIC,
    "Itemnumber" NUMERIC,
    "Plantationarea" TEXT,
    "Areablocknumber" TEXT,
    "Rownumber" NUMERIC,
    "Rowtype" TEXT,
    "Plantnumber" NUMERIC,
    "Planttype" TEXT,
    "TransectLineName" TEXT,

    -- PLANT HEALTH (Booleans stored as Integer/Numeric)
    "Spotsonleaves" INTEGER,
    "Yellowleaves" INTEGER,
    "Droppingdryordroopingleaves" INTEGER,
    "Visiblepests" NUMERIC,     -- DB uses Numeric
    "Recentpestdamage" NUMERIC, -- DB uses Numeric
    "Typeofpests" TEXT,

    -- MEDIA FIELDS (Missing in your list)
    "Planthealthphoto1" TEXT,
    "Planthealthphoto2" TEXT,
    "Planthealthphoto3" TEXT,
    "Pestphoto1" TEXT,
    "Pestphoto2" TEXT,
    "Pestphoto3" TEXT,
    "Voicememo" NUMERIC,   -- DB uses Numeric
    "Videoclip" NUMERIC,   -- DB uses Numeric

    -- METRICS
    "Berrytype" TEXT,
    "Fixername" TEXT,
    "oldBambooNumberofculms" NUMERIC,
    "oldBambooMarkercolour" TEXT,
    "oldBambooDiameteratbase" NUMERIC,
    "oldBambooCulmheight" NUMERIC,
    "newBambooShoots" NUMERIC,
    "newBambooMarkercolour" TEXT,
    "newBambooShootdiameter" NUMERIC, -- Missing in your list
    "newBambooShootheight" NUMERIC,
    "fruitHeight" NUMERIC,
    "fruitDiameter" NUMERIC,
    "fruitNumberofbranches" NUMERIC,
    "fruitNumberofflowerclusters" NUMERIC,
    "fruitNumberoffruit" NUMERIC,

    -- ENVIRONMENTAL DATA
    "Sufficientmulch" INTEGER,
    "Sufficientcompostmanure" INTEGER,
    "Soilmoisture" TEXT,
    "Electricalconductivity" NUMERIC,
    "pHvalue" NUMERIC,
    "Temperature" NUMERIC,
    "Moisture" NUMERIC,
    "Rainfall" NUMERIC,
    "ET" NUMERIC,
    "Slope" TEXT,
    "BulkDensity" NUMERIC,
    "ESP" NUMERIC,
    "Additionalcomments" TEXT,

    -- CALCULATED BIOMASS (Missing in your list)
    "oldculmbiomass" NUMERIC,
    "newculmbiomass" NUMERIC,
    "totalplantbiomass" NUMERIC,
    "perhectarebiomass" NUMERIC,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(site_id),
    observation_id UUID REFERENCES observations(observation_id),
    
    -- Fields populated by Rules Engine / Index.js
    alert_type TEXT,
    severity TEXT,
    message TEXT,
    
    -- Fields with Defaults / Nulls for initial insert
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'ignored')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Fields for Manual/Auto Resolution
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES profiles(user_id)
);

-- 9. Recommendations Table
-- 8. Recommendations Table
CREATE TABLE IF NOT EXISTS recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(site_id),
    observation_id UUID REFERENCES observations(observation_id),
    
    -- Optional link to an alert, if applicable
    alert_id UUID REFERENCES alerts(alert_id),
    
    title TEXT,
    body TEXT,
    priority TEXT,
    
    -- Defaults found in live DB
    status TEXT DEFAULT 'pending', 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    due_by TIMESTAMPTZ
);

-- 10. Tasks Table
-- 9. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID REFERENCES organisations(organisation_id),
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK (priority IN ('Low', 'Medium', 'High')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    due_date TIMESTAMPTZ,
    assigned_to UUID REFERENCES profiles(user_id),
    created_by UUID REFERENCES profiles(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 11. Sensors Table
-- 10. Sensors Table
CREATE TABLE IF NOT EXISTS sensors (
    sensor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID REFERENCES organisations(organisation_id),
    site_id UUID REFERENCES sites(site_id),
    sensor_type VARCHAR(255) NOT NULL, -- Verified: character varying
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    serial_number VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    installed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);


-- 12. TNFD Metrics Table
-- 11. TNFD Metrics Table
CREATE TABLE IF NOT EXISTS tnfd_metrics (
    metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(site_id),
    metric_name TEXT NOT NULL,
    value NUMERIC,
    unit TEXT,
    method TEXT,
    uncertainty TEXT,
    qa_status TEXT CHECK (qa_status IN ('pass', 'review', 'fail')),
    provenance TEXT,
    reported_at TIMESTAMPTZ DEFAULT NOW()
);
