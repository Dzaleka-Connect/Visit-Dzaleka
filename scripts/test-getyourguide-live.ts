import dotenv from 'dotenv';
import { notifyAvailabilityUpdate, notifyAvailabilityWithPrice } from '../server/lib/getyourguide';

dotenv.config();

/**
 * GetYourGuide Live Testing Script
 * 
 * This script pushes availability and pricing for all 4 required product types:
 * 1. Time Point for Individuals
 * 2. Time Point for Groups
 * 3. Time Period for Individuals
 * 4. Time Period for Groups
 */

const TIMEZONE = '+02:00'; // Africa/Blantyre
const START_DATE = new Date('2026-02-01');
const END_DATE = new Date('2026-03-31');
const UNAVAILABLE_DATE = new Date('2026-02-14'); // Valentine's Day example

// Product IDs for each scenario
const PRODUCTS = {
    timePointIndividual: 'dzaleka-tour-timepoint-individual',
    timePointGroup: 'dzaleka-tour-timepoint-group',
    timePeriodIndividual: 'dzaleka-tour-period-individual',
    timePeriodGroup: 'dzaleka-tour-period-group',
};

// Pricing
const PRICE_PER_PERSON = 25000; // 25,000 MWK (~$15 USD)
const PRICE_PER_GROUP = 150000; // 150,000 MWK for group of up to 10

// Time slots for time-point products
const TIME_SLOTS = ['09:00:00', '14:00:00'];

// Operating hours for time-period products (9 AM - 5 PM)
const OPERATING_HOURS = Array.from({ length: 8 }, (_, i) => {
    const hour = 9 + i;
    return `${hour.toString().padStart(2, '0')}:00:00`;
});

function getDateRange(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(start);

    while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }

    return dates;
}

function formatDateTime(date: Date, time: string): string {
    const dateStr = date.toISOString().split('T')[0];
    return `${dateStr}T${time}${TIMEZONE}`;
}

function isUnavailable(date: Date): boolean {
    return date.toDateString() === UNAVAILABLE_DATE.toDateString();
}

async function test1_TimePointIndividuals() {
    console.log('\n📋 Test 1: Time Point for Individuals');
    console.log('=====================================');

    const dates = getDateRange(START_DATE, END_DATE);
    let successCount = 0;
    let failCount = 0;

    for (const date of dates) {
        if (isUnavailable(date)) {
            console.log(`⏭️  Skipping ${date.toISOString().split('T')[0]} (marked unavailable)`);
            continue;
        }

        for (const timeSlot of TIME_SLOTS) {
            const datetime = formatDateTime(date, timeSlot);

            try {
                await notifyAvailabilityWithPrice(
                    PRODUCTS.timePointIndividual,
                    datetime,
                    15, // 15 spots per time slot
                    PRICE_PER_PERSON,
                    false // USE PRODUCTION
                );
                successCount++;
                if (successCount % 10 === 0) {
                    console.log(`✅ Progress: ${successCount} slots updated`);
                }
            } catch (error: any) {
                console.error(`❌ Failed for ${datetime}:`, error.message);
                failCount++;
            }

            // Rate limiting - wait 100ms between requests
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    console.log(`\n✅ Test 1 Complete: ${successCount} success, ${failCount} failed`);
}

async function test2_TimePointGroups() {
    console.log('\n📋 Test 2: Time Point for Groups');
    console.log('==================================');

    const dates = getDateRange(START_DATE, END_DATE);
    let successCount = 0;
    let failCount = 0;

    for (const date of dates) {
        if (isUnavailable(date)) continue;

        for (const timeSlot of TIME_SLOTS) {
            const datetime = formatDateTime(date, timeSlot);

            try {
                await notifyAvailabilityWithPrice(
                    PRODUCTS.timePointGroup,
                    datetime,
                    5, // 5 groups per time slot
                    PRICE_PER_GROUP,
                    false
                );
                successCount++;
                if (successCount % 10 === 0) {
                    console.log(`✅ Progress: ${successCount} slots updated`);
                }
            } catch (error: any) {
                console.error(`❌ Failed for ${datetime}:`, error.message);
                failCount++;
            }

            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    console.log(`\n✅ Test 2 Complete: ${successCount} success, ${failCount} failed`);
}

async function test3_TimePeriodIndividuals() {
    console.log('\n📋 Test 3: Time Period for Individuals');
    console.log('=======================================');

    const dates = getDateRange(START_DATE, END_DATE);
    let successCount = 0;
    let failCount = 0;

    for (const date of dates) {
        if (isUnavailable(date)) continue;

        for (const hour of OPERATING_HOURS) {
            const datetime = formatDateTime(date, hour);

            try {
                await notifyAvailabilityWithPrice(
                    PRODUCTS.timePeriodIndividual,
                    datetime,
                    20, // 20 spots per hour
                    PRICE_PER_PERSON,
                    false
                );
                successCount++;
                if (successCount % 20 === 0) {
                    console.log(`✅ Progress: ${successCount} slots updated`);
                }
            } catch (error: any) {
                console.error(`❌ Failed for ${datetime}:`, error.message);
                failCount++;
            }

            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    console.log(`\n✅ Test 3 Complete: ${successCount} success, ${failCount} failed`);
}

async function test4_TimePeriodGroups() {
    console.log('\n📋 Test 4: Time Period for Groups');
    console.log('==================================');

    const dates = getDateRange(START_DATE, END_DATE);
    let successCount = 0;
    let failCount = 0;

    for (const date of dates) {
        if (isUnavailable(date)) continue;

        for (const hour of OPERATING_HOURS) {
            const datetime = formatDateTime(date, hour);

            try {
                await notifyAvailabilityWithPrice(
                    PRODUCTS.timePeriodGroup,
                    datetime,
                    10, // 10 groups per hour
                    PRICE_PER_GROUP,
                    false
                );
                successCount++;
                if (successCount % 20 === 0) {
                    console.log(`✅ Progress: ${successCount} slots updated`);
                }
            } catch (error: any) {
                console.error(`❌ Failed for ${datetime}:`, error.message);
                failCount++;
            }

            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    console.log(`\n✅ Test 4 Complete: ${successCount} success, ${failCount} failed`);
}

async function runLiveTests() {
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║  GetYourGuide Live Testing - All 4 Scenarios          ║');
    console.log('║  Testing against PRODUCTION environment               ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log();
    console.log(`📅 Date Range: ${START_DATE.toISOString().split('T')[0]} to ${END_DATE.toISOString().split('T')[0]}`);
    console.log(`🚫 Unavailable: ${UNAVAILABLE_DATE.toISOString().split('T')[0]}`);
    console.log(`💰 Individual Price: ${PRICE_PER_PERSON.toLocaleString()} MWK`);
    console.log(`💰 Group Price: ${PRICE_PER_GROUP.toLocaleString()} MWK`);
    console.log();

    const startTime = Date.now();

    try {
        // Run all 4 tests sequentially
        await test1_TimePointIndividuals();
        await test2_TimePointGroups();
        await test3_TimePeriodIndividuals();
        await test4_TimePeriodGroups();

        const duration = Math.round((Date.now() - startTime) / 1000);

        console.log('\n╔═══════════════════════════════════════════════════════╗');
        console.log('║  All Tests Complete!                                  ║');
        console.log('╚═══════════════════════════════════════════════════════╝');
        console.log(`⏱️  Total Duration: ${duration} seconds`);
        console.log();
        console.log('📝 Next Steps:');
        console.log('1. Go to GetYourGuide Integrator Portal');
        console.log('2. Configure each product type in the self-testing tool');
        console.log('3. Click "Test your integration" for each');
        console.log('4. Wait for all tests to show "Completed" status');
        console.log('5. Submit for production approval');

    } catch (error) {
        console.error('\n❌ Testing failed:', error);
        process.exit(1);
    }
}

// Run the tests
runLiveTests();
