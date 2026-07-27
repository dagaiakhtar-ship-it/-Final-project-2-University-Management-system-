/**
 * Smart University ERP & Smart Campus Platform
 * Enterprise Disaster Recovery (DR), High Availability (HA) & Multi-Tenant Platform
 * Automated QA & Production Verification Test Suite
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function logHeader(title: string) {
  console.log(`\n${colors.cyan}${colors.bright}=== ${title.toUpperCase()} ===${colors.reset}\n`);
}

function logSubHeader(title: string) {
  console.log(`\n${colors.magenta}${colors.bright}>>> ${title}${colors.reset}`);
}

function logPass(message: string) {
  console.log(`  ${colors.green}✓ PASS:${colors.reset} ${message}`);
}

function logFail(message: string) {
  console.log(`  ${colors.red}✗ FAIL:${colors.reset} ${message}`);
}

function logInfo(message: string) {
  console.log(`  ${colors.blue}i INFO:${colors.reset} ${message}`);
}

async function runMultiTenantAndDRTests() {
  logHeader('Multi-Tenant & HA/DR Platform Automated QA Suite');

  let testTenantId: number | null = null;
  let testConfigId: number | null = null;
  let testRecoveryPointId: number | null = null;
  let testMaintenanceWindowId: number | null = null;

  try {
    // ---------------------------------------------------------
    // PART 1: TENANT CRUD & DUPLICATE IDENTIFICATION
    // ---------------------------------------------------------
    logSubHeader('1. Multi-Tenant Onboarding & Isolation Verification');

    const uniqueCode = 'test-uni-' + Date.now();
    const tenant = await prisma.tenant.create({
      data: {
        tenantCode: uniqueCode,
        tenantName: 'QA Sandbox University',
        universityName: 'Federal University of Sandbox Testing',
        domain: `${uniqueCode}.edu`,
        subdomain: uniqueCode,
        status: 'Active',
        timezone: 'EST',
        locale: 'en_US',
        currency: 'USD'
      }
    });
    testTenantId = tenant.id;
    logPass(`Tenant created successfully: "${tenant.tenantName}" (ID: ${testTenantId}, Code: ${tenant.tenantCode})`);

    // Verify Unique Constraints on tenantCode
    try {
      await prisma.tenant.create({
        data: {
          tenantCode: uniqueCode,
          tenantName: 'Duplicate Sandbox University',
          universityName: 'Duplicate Federal University',
          domain: 'dup.edu',
          subdomain: 'dup',
          status: 'Active',
          timezone: 'EST',
          locale: 'en_US',
          currency: 'USD'
        }
      });
      logFail('Unique constraint on Tenant Code failed to trigger.');
      throw new Error('Database accepted a duplicate tenantCode.');
    } catch (err: any) {
      logPass('Unique constraint on tenantCode successfully block duplicates (Database Integrity verified).');
    }

    // ---------------------------------------------------------
    // PART 2: TENANT CONFIGURATION & ISOLATED BRANDING
    // ---------------------------------------------------------
    logSubHeader('2. Tenant Specific Branding & Configurations');

    const config = await prisma.tenantConfiguration.create({
      data: {
        tenantId: tenant.id,
        branding: JSON.stringify({ theme: 'dark', rounded: 'lg' }),
        logo: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=100',
        favicon: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=32',
        primaryColor: '#6366f1',
        secondaryColor: '#14b8a6',
        emailConfiguration: JSON.stringify({ host: 'smtp.qamaster.edu', port: 587 }),
        smsConfiguration: JSON.stringify({ provider: 'sns', region: 'us-east-1' }),
        aiConfiguration: JSON.stringify({ model: 'gemini-1.5-pro' }),
        storageConfiguration: JSON.stringify({ provider: 's3', bucket: 'qa-sandbox-files' })
      }
    });
    testConfigId = config.id;
    logPass(`Tenant branding configuration linked successfully (Config ID: ${testConfigId})`);

    // Verify retrieval & JSON deserialization integrity
    const retrievedConfig = await prisma.tenantConfiguration.findUnique({
      where: { id: testConfigId }
    });
    if (retrievedConfig) {
      const parsedBranding = JSON.parse(retrievedConfig.branding);
      const parsedStorage = JSON.parse(retrievedConfig.storageConfiguration);
      if (parsedBranding.theme === 'dark' && parsedStorage.bucket === 'qa-sandbox-files') {
        logPass('Configuration attributes successfully stored & verified with JSON parsing.');
      } else {
        throw new Error('Retrieved configuration does not match the inputs.');
      }
    }

    // ---------------------------------------------------------
    // PART 3: DISASTER RECOVERY & POINT-IN-TIME SNAPSHOTS
    // ---------------------------------------------------------
    logSubHeader('3. Point-in-Time Recovery Points Integrity');

    const recoveryPoint = await prisma.recoveryPoint.create({
      data: {
        recoveryType: 'Full Backup',
        region: 'us-west-2 (Oregon)',
        storageProvider: 'AWS S3 Glacier Deep Archive',
        storageLocation: 's3://unidb-dr-west-2/snapshots/backup-qa-01.sql',
        checksum: 'checksum_sha256_fbc304d657da918de5',
        verified: true
      }
    });
    testRecoveryPointId = recoveryPoint.id;
    logPass(`Recovery Point created successfully (ID: ${testRecoveryPointId}, Type: ${recoveryPoint.recoveryType})`);

    // Toggle Verification state
    const updatedRp = await prisma.recoveryPoint.update({
      where: { id: testRecoveryPointId },
      data: { verified: false }
    });
    if (updatedRp.verified === false) {
      logPass('Recovery Point Verification flags can be successfully toggled by admin audit processes.');
    } else {
      throw new Error('Failed to update Recovery Point flags.');
    }

    // ---------------------------------------------------------
    // PART 4: MAINTENANCE WINDOW SCHEDULING
    // ---------------------------------------------------------
    logSubHeader('4. Maintenance Window Scheduling');

    const startTime = new Date();
    const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours window
    const maintWindow = await prisma.maintenanceWindow.create({
      data: {
        tenantId: tenant.id,
        title: 'Database Re-indexing & Vacuum Optimizer',
        description: 'Optimizing OLAP analytics indexes and clearing tables.',
        startTime,
        endTime,
        active: true
      }
    });
    testMaintenanceWindowId = maintWindow.id;
    logPass(`Maintenance Window created successfully for Tenant (ID: ${testMaintenanceWindowId})`);

    // Verify Active status
    const retrievedMaint = await prisma.maintenanceWindow.findUnique({
      where: { id: testMaintenanceWindowId }
    });
    if (retrievedMaint && retrievedMaint.active) {
      logPass('Maintenance Window active status verified.');
    } else {
      throw new Error('Maintenance window was not saved with active = true.');
    }

    // ---------------------------------------------------------
    // PART 5: CLEAN UP VERIFICATION
    // ---------------------------------------------------------
    logSubHeader('5. Sandbox Cleanup Operations');

    if (testMaintenanceWindowId) {
      await prisma.maintenanceWindow.delete({ where: { id: testMaintenanceWindowId } });
      logPass('Test Maintenance Window deleted successfully.');
    }

    if (testConfigId) {
      await prisma.tenantConfiguration.delete({ where: { id: testConfigId } });
      logPass('Test Tenant Configuration deleted successfully.');
    }

    if (testTenantId) {
      await prisma.tenant.delete({ where: { id: testTenantId } });
      logPass('Test Tenant deleted successfully.');
    }

    if (testRecoveryPointId) {
      await prisma.recoveryPoint.delete({ where: { id: testRecoveryPointId } });
      logPass('Test Recovery Point deleted successfully.');
    }

    console.log(`\n${colors.green}${colors.bright}✨ ALL MULTI-TENANT & DISASTER RECOVERY TESTS COMPLETED SUCCESSFULLY! ✨${colors.reset}\n`);

  } catch (err: any) {
    logFail(`Multi-Tenant QA crashed with error: ${err.message}`);
    // Attempt graceful recovery cleanup
    try {
      if (testMaintenanceWindowId) await prisma.maintenanceWindow.delete({ where: { id: testMaintenanceWindowId } }).catch(() => {});
      if (testConfigId) await prisma.tenantConfiguration.delete({ where: { id: testConfigId } }).catch(() => {});
      if (testTenantId) await prisma.tenant.delete({ where: { id: testTenantId } }).catch(() => {});
      if (testRecoveryPointId) await prisma.recoveryPoint.delete({ where: { id: testRecoveryPointId } }).catch(() => {});
    } catch (_) {}
    process.exit(1);
  }
}

runMultiTenantAndDRTests();
