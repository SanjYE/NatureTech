-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Organisations Table
CREATE TABLE IF NOT EXISTS organisations (
    organisation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    org_type TEXT,
    country_code VARCHAR(2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles Table (Users)
CREATE TABLE IF NOT EXISTS profiles (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Organisation Memberships Table
CREATE TABLE IF NOT EXISTS organisation_memberships (
    organisation_id UUID REFERENCES organisations(organisation_id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('Admin', 'Member', 'Viewer')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (organisation_id, user_id)
);

-- 4. Sites Table
CREATE TABLE IF NOT EXISTS sites (
    site_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID REFERENCES organisations(organisation_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    site_type TEXT,
    country_code VARCHAR(10),
    admin_area TEXT,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    geom TEXT, -- Storing GeoJSON or WKT
    elevation_m NUMERIC,
    area_ha NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Site Units Table (Polygons/Blocks within a site)
CREATE TABLE IF NOT EXISTS site_units (
    unit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(site_id) ON DELETE CASCADE,
    name TEXT,
    unit_type TEXT,
    geom TEXT,
    area_ha NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Crops / Plant Types Lookup Table
CREATE TABLE IF NOT EXISTS crops (
    species_code VARCHAR(10) PRIMARY KEY,
    plant_type_name TEXT UNIQUE
);

-- 7. Observations Table (Field Data)
CREATE TABLE IF NOT EXISTS observations (
    observation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(site_id),
    "SubmittedBy" TEXT,
    "SubmittedOn" TIMESTAMP,
    "LocationGPS" TEXT,
    "Plantationarea" TEXT,
    "Areablocknumber" TEXT,
    "Rownumber" TEXT,
    "Plantnumber" TEXT,
    "Planttype" TEXT,
    "Spotsonleaves" TEXT,
    "Yellowleaves" TEXT,
    "Droppingdryordroopingleaves" TEXT,
    "Visiblepests" TEXT,
    "Recentpestdamage" TEXT,
    "Typeofpests" TEXT,
    "Additionalcomments" TEXT,
    "Diameteratbase" TEXT,
    "FormName" TEXT DEFAULT 'Plant health monitoring',
    "FormVersion" TEXT,
    "DataYear" INTEGER DEFAULT 2026,
    "Rowtype" TEXT,
    "Berrytype" TEXT,
    "Fixername" TEXT,
    "oldBambooNumberofculms" NUMERIC,
    "oldBambooMarkercolour" TEXT,
    "oldBambooDiameteratbase" NUMERIC,
    "oldBambooCulmheight" NUMERIC,
    "newBambooShoots" NUMERIC,
    "newBambooMarkercolour" TEXT,
    "newBambooShootheight" NUMERIC,
    "fruitHeight" NUMERIC,
    "fruitDiameter" NUMERIC,
    "fruitNumberofbranches" NUMERIC,
    "fruitNumberofflowerclusters" NUMERIC,
    "fruitNumberoffruit" NUMERIC,
    "Sufficientmulch" TEXT,
    "Sufficientcompostmanure" TEXT,
    "Soilmoisture" TEXT,
    "Electricalconductivity" NUMERIC,
    "pHvalue" NUMERIC,
    "Temperature" NUMERIC,
    "Moisture" NUMERIC,
    "TransectLineName" TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(site_id),
    observation_id UUID REFERENCES observations(observation_id),
    alert_type TEXT,
    severity TEXT,
    message TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'ignored')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES profiles(user_id)
);

-- 9. Recommendations Table
CREATE TABLE IF NOT EXISTS recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(site_id),
    alert_id UUID REFERENCES alerts(alert_id),
    observation_id UUID REFERENCES observations(observation_id),
    title TEXT,
    body TEXT,
    priority TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    due_by TIMESTAMPTZ
);

-- 10. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID REFERENCES organisations(organisation_id),
    created_by UUID REFERENCES profiles(user_id),
    assigned_to UUID REFERENCES profiles(user_id),
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK (priority IN ('Low', 'Medium', 'High')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 11. Sensors Table
CREATE TABLE IF NOT EXISTS sensors (
    sensor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID REFERENCES organisations(organisation_id),
    site_id UUID REFERENCES sites(site_id),
    sensor_type VARCHAR(50) NOT NULL,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    installed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 12. TNFD Metrics Table
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

-- Sample Data Insertion (Optional - Commented out)
-- INSERT INTO crops (species_code, plant_type_name) VALUES ('001', 'Coffee');
-- INSERT INTO crops (species_code, plant_type_name) VALUES ('002', 'Banana');
