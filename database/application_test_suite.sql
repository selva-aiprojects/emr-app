-- =====================================================
-- APPLICATION TEST SUITE - POST-MIGRATION VERIFICATION
-- =====================================================
-- Run this after migration to test all critical functionality

SELECT '=== APPLICATION TEST SUITE ===' as test_suite;

-- Create test results table
CREATE TABLE IF NOT EXISTS emr.test_results (
    id SERIAL PRIMARY KEY,
    test_name VARCHAR(255) NOT NULL,
    test_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    result_data JSONB,
    error_message TEXT,
    test_time TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TEST 1: DATABASE CONNECTIVITY
-- =====================================================

DO $$
DECLARE
    test_status TEXT;
    result_data JSONB;
    error_msg TEXT;
BEGIN
    BEGIN
        -- Test basic connectivity
        SELECT current_database(), current_schema(), version() INTO result_data;
        
        INSERT INTO emr.test_results (test_name, test_type, status, result_data)
        VALUES ('Database Connectivity', 'INFRASTRUCTURE', 'PASSED', result_data);
        
        RAISE NOTICE '✅ TEST 1 PASSED: Database Connectivity';
        
    EXCEPTION WHEN others THEN
        error_msg := SQLERRM;
        INSERT INTO emr.test_results (test_name, test_type, status, error_message)
        VALUES ('Database Connectivity', 'INFRASTRUCTURE', 'FAILED', error_msg);
        
        RAISE NOTICE '❌ TEST 1 FAILED: Database Connectivity - %', error_msg;
    END;
END $$;

-- =====================================================
-- TEST 2: CORE TABLES ACCESS
-- =====================================================

DO $$
DECLARE
    table_record RECORD;
    test_count INTEGER;
    total_tests INTEGER := 5;
    passed_tests INTEGER := 0;
BEGIN
    RAISE NOTICE '=== TEST 2: CORE TABLES ACCESS ===';
    
    -- Test key tables
    FOR table_record IN 
        SELECT 'tenants' as tablename UNION ALL
        SELECT 'users' UNION ALL
        SELECT 'patients' UNION ALL
        SELECT 'appointments' UNION ALL
        SELECT 'encounters'
    LOOP
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'emr' AND tablename = table_record.tablename) THEN
                EXECUTE format('SELECT COUNT(*) FROM emr.%I', table_record.tablename) INTO test_count;
                
                INSERT INTO emr.test_results (test_name, test_type, status, result_data)
                VALUES (
                    format('Access %s table', table_record.tablename), 
                    'TABLE_ACCESS', 
                    'PASSED', 
                    jsonb_build_object('table', table_record.tablename, 'row_count', test_count)
                );
                
                RAISE NOTICE '✅ %s table accessible (% rows)', table_record.tablename, test_count;
                passed_tests := passed_tests + 1;
            ELSE
                INSERT INTO emr.test_results (test_name, test_type, status, error_message)
                VALUES (
                    format('Access %s table', table_record.tablename), 
                    'TABLE_ACCESS', 
                    'FAILED', 
                    'Table does not exist in emr schema'
                );
                
                RAISE NOTICE '❌ %s table not found in emr schema', table_record.tablename;
            END IF;
            
        EXCEPTION WHEN others THEN
            INSERT INTO emr.test_results (test_name, test_type, status, error_message)
            VALUES (
                format('Access %s table', table_record.tablename), 
                'TABLE_ACCESS', 
                'FAILED', 
                SQLERRM
            );
            
            RAISE NOTICE '❌ %s table access failed: %', table_record.tablename, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'TEST 2 RESULT: %/% core tables accessible', passed_tests, total_tests;
END $$;

-- =====================================================
-- TEST 3: USER AUTHENTICATION QUERIES
-- =====================================================

DO $$
DECLARE
    test_result RECORD;
    user_count INTEGER;
BEGIN
    BEGIN
        -- Test user query (similar to login)
        SELECT COUNT(*) INTO user_count FROM emr.users WHERE is_active = true;
        
        INSERT INTO emr.test_results (test_name, test_type, status, result_data)
        VALUES (
            'User Authentication Query', 
            'AUTHENTICATION', 
            'PASSED', 
            jsonb_build_object('active_users', user_count)
        );
        
        RAISE NOTICE '✅ TEST 3 PASSED: User Authentication Query (% active users)', user_count;
        
    EXCEPTION WHEN others THEN
        INSERT INTO emr.test_results (test_name, test_type, status, error_message)
        VALUES ('User Authentication Query', 'AUTHENTICATION', 'FAILED', SQLERRM);
        
        RAISE NOTICE '❌ TEST 3 FAILED: User Authentication Query - %', SQLERRM;
    END;
END $$;

-- =====================================================
-- TEST 4: TENANT FUNCTIONALITY
-- =====================================================

DO $$
DECLARE
    tenant_count INTEGER;
    patient_count INTEGER;
BEGIN
    BEGIN
        -- Test tenant access
        SELECT COUNT(*) INTO tenant_count FROM emr.tenants WHERE status = 'active';
        
        -- Test patient-tenant relationship
        SELECT COUNT(*) INTO patient_count FROM emr.patients p 
        JOIN emr.tenants t ON p.tenant_id = t.id;
        
        INSERT INTO emr.test_results (test_name, test_type, status, result_data)
        VALUES (
            'Tenant Functionality', 
            'TENANCY', 
            'PASSED', 
            jsonb_build_object('active_tenants', tenant_count, 'linked_patients', patient_count)
        );
        
        RAISE NOTICE '✅ TEST 4 PASSED: Tenant Functionality (% tenants, % linked patients)', tenant_count, patient_count;
        
    EXCEPTION WHEN others THEN
        INSERT INTO emr.test_results (test_name, test_type, status, error_message)
        VALUES ('Tenant Functionality', 'TENANCY', 'FAILED', SQLERRM);
        
        RAISE NOTICE '❌ TEST 4 FAILED: Tenant Functionality - %', SQLERRM;
    END;
END $$;

-- =====================================================
-- TEST 5: APPOINTMENT SYSTEM
-- =====================================================

DO $$
DECLARE
    appointment_count INTEGER;
    upcoming_count INTEGER;
BEGIN
    BEGIN
        -- Test appointment queries
        SELECT COUNT(*) INTO appointment_count FROM emr.appointments;
        
        -- Test upcoming appointments
        SELECT COUNT(*) INTO upcoming_count FROM emr.appointments 
        WHERE start >= CURRENT_DATE;
        
        INSERT INTO emr.test_results (test_name, test_type, status, result_data)
        VALUES (
            'Appointment System', 
            'APPOINTMENTS', 
            'PASSED', 
            jsonb_build_object('total_appointments', appointment_count, 'upcoming', upcoming_count)
        );
        
        RAISE NOTICE '✅ TEST 5 PASSED: Appointment System (% total, % upcoming)', appointment_count, upcoming_count;
        
    EXCEPTION WHEN others THEN
        INSERT INTO emr.test_results (test_name, test_type, status, error_message)
        VALUES ('Appointment System', 'APPOINTMENTS', 'FAILED', SQLERRM);
        
        RAISE NOTICE '❌ TEST 5 FAILED: Appointment System - %', SQLERRM;
    END;
END $$;

-- =====================================================
-- TEST 6: BILLING SYSTEM
-- =====================================================

DO $$
DECLARE
    invoice_count INTEGER;
    total_revenue DECIMAL;
BEGIN
    BEGIN
        -- Test billing queries
        SELECT COUNT(*) INTO invoice_count FROM emr.invoices;
        
        -- Test revenue calculation
        SELECT COALESCE(SUM(total_amount), 0) INTO total_revenue FROM emr.invoices 
        WHERE status = 'paid';
        
        INSERT INTO emr.test_results (test_name, test_type, status, result_data)
        VALUES (
            'Billing System', 
            'BILLING', 
            'PASSED', 
            jsonb_build_object('total_invoices', invoice_count, 'paid_revenue', total_revenue)
        );
        
        RAISE NOTICE '✅ TEST 6 PASSED: Billing System (% invoices, $% revenue)', invoice_count, total_revenue;
        
    EXCEPTION WHEN others THEN
        INSERT INTO emr.test_results (test_name, test_type, status, error_message)
        VALUES ('Billing System', 'BILLING', 'FAILED', SQLERRM);
        
        RAISE NOTICE '❌ TEST 6 FAILED: Billing System - %', SQLERRM;
    END;
END $$;

-- =====================================================
-- TEST 7: FOREIGN KEY CONSTRAINTS
-- =====================================================

DO $$
DECLARE
    constraint_count INTEGER;
    broken_count INTEGER;
BEGIN
    BEGIN
        -- Test foreign key constraints
        SELECT COUNT(*) INTO constraint_count
        FROM information_schema.table_constraints tc
        WHERE tc.table_schema = 'emr'
          AND tc.constraint_type = 'FOREIGN KEY';
        
        -- Check for broken references (simplified)
        SELECT COUNT(*) INTO broken_count FROM (
            SELECT 1 FROM emr.patients p 
            LEFT JOIN emr.tenants t ON p.tenant_id = t.id 
            WHERE p.tenant_id IS NOT NULL AND t.id IS NULL
        ) broken_refs;
        
        INSERT INTO emr.test_results (test_name, test_type, status, result_data)
        VALUES (
            'Foreign Key Constraints', 
            'INTEGRITY', 
            CASE WHEN broken_count = 0 THEN 'PASSED' ELSE 'FAILED' END, 
            jsonb_build_object('constraints', constraint_count, 'broken_refs', broken_count)
        );
        
        IF broken_count = 0 THEN
            RAISE NOTICE '✅ TEST 7 PASSED: Foreign Key Constraints (% constraints, no broken refs)', constraint_count;
        ELSE
            RAISE NOTICE '❌ TEST 7 FAILED: Foreign Key Constraints (% broken references found)', broken_count;
        END IF;
        
    EXCEPTION WHEN others THEN
        INSERT INTO emr.test_results (test_name, test_type, status, error_message)
        VALUES ('Foreign Key Constraints', 'INTEGRITY', 'FAILED', SQLERRM);
        
        RAISE NOTICE '❌ TEST 7 FAILED: Foreign Key Constraints - %', SQLERRM;
    END;
END $$;

-- =====================================================
-- TEST RESULTS SUMMARY
-- =====================================================

SELECT '=== TEST RESULTS SUMMARY ===' as summary;

SELECT 
    test_name,
    test_type,
    status,
    CASE 
        WHEN status = 'PASSED' THEN '✅'
        ELSE '❌'
    END as status_icon,
    test_time
FROM emr.test_results 
ORDER BY test_time;

-- Overall test summary
SELECT 
    'OVERALL_RESULTS' as summary_type,
    COUNT(*) as total_tests,
    COUNT(*) FILTER (WHERE status = 'PASSED') as passed_tests,
    COUNT(*) FILTER (WHERE status = 'FAILED') as failed_tests,
    CASE 
        WHEN COUNT(*) FILTER (WHERE status = 'FAILED') = 0 THEN '✅ ALL TESTS PASSED'
        ELSE '❌ SOME TESTS FAILED'
    END as overall_status
FROM emr.test_results;

-- =====================================================
-- APPLICATION TESTING INSTRUCTIONS
-- =====================================================

SELECT '=== APPLICATION TESTING INSTRUCTIONS ===' as instructions;

SELECT 'Database tests completed. Now test the application:' as next_steps;
SELECT '1. Start server: npm start or node server/index.js' as step1;
SELECT '2. Open browser: http://localhost:4000' as step2;
SELECT '3. Test login with existing credentials' as step3;
SELECT '4. Navigate through different modules' as step4;
SELECT '5. Test patient creation/editing' as step5;
SELECT '6. Test appointment scheduling' as step6;
SELECT '7. Test billing/invoicing' as step7;
SELECT '8. Test pharmacy features' as step8;

SELECT '=== TEST SUITE COMPLETE ===' as complete;
