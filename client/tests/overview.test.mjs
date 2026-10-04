import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/utils/overview.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { summarizeOverview, filterOverviewRooms, overviewActivity } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('applications and unassigned approvals do not inflate assigned occupancy', () => {
    const summary = summarizeOverview([{ capacity: 4, currentOccupants: 1 }, { capacity: 2, currentOccupants: 0 }], [
        { isApproved: false, roomNumber: '108' }, { isApproved: true, roomNumber: 'Unassigned' },
        { isApproved: true, roomNumber: '108' }, { isApproved: true },
    ], [], []);
    assert.equal(summary.pendingApplicants, 1);
    assert.equal(summary.unassignedTenants, 2);
    assert.equal(summary.assignedTenants, 1);
    assert.equal(summary.occupiedPlaces, 1);
    assert.equal(summary.availablePlaces, 5);
    assert.equal(summary.totalCapacity, 6);
});
test('review includes anomalous receipts and verified amount uses only current-month verified records', () => {
    const payments = [
        { status: 'Verified', amount: '2500', datePaid: '2026-10-01T12:00:00' },
        { status: 'Verified', amount: 5000, datePaid: '2026-09-30T12:00:00' },
        { status: 'Pending', amount: 2000, datePaid: '2026-10-02' },
        { status: 'Anomalous', amount: 1500, datePaid: '2026-10-02' },
        { status: 'Rejected', amount: 4000, datePaid: '2026-10-02' },
    ];
    const summary = summarizeOverview([], [], payments, [], new Date(2026, 9, 3));
    assert.equal(summary.receiptsToReview, 2);
    assert.equal(summary.verifiedAmount, 2500);
});
test('urgent work excludes completed and rejected requests and availability never becomes negative', () => {
    const summary = summarizeOverview([{ capacity: 1, currentOccupants: 2 }], [], [], [
        { status: 'Pending', urgency: 'High' }, { status: 'In Progress', urgency: 'Emergency' },
        { status: 'Completed', urgency: 'Emergency' }, { status: 'Rejected', urgency: 'High' },
        { status: 'Pending', urgency: 'Low' },
    ]);
    assert.equal(summary.activeRequests, 3);
    assert.equal(summary.urgentRequests, 2);
    assert.equal(summary.availablePlaces, 0);
    assert.equal(summary.occupiedPlaces, 2);
});
test('local room filtering trims whitespace and matches assigned names without changing data', () => {
    const rooms = [{ room_number: '108', occupants: [{ name: 'Alex Rivera' }] }, { room_number: 'West A', occupants: [] }];
    assert.deepEqual(filterOverviewRooms(rooms, '  ALEX  '), [rooms[0]]);
    assert.deepEqual(filterOverviewRooms(rooms, 'west'), [rooms[1]]);
    assert.deepEqual(filterOverviewRooms(rooms, 'unknown'), []);
    assert.equal(filterOverviewRooms(rooms, '   '), rooms);
});
test('activity preserves payment status, uses the corresponding route, and omits fabricated dates', () => {
    const activity = overviewActivity([{ id: '1', name: 'No date', isApproved: false }], [
        { id: '2', tenantName: 'Alex', status: 'Rejected', datePaid: '2026-10-02' },
        { id: '3', status: 'Verified', datePaid: 'invalid' },
    ], [{ id: '4', issueType: 'Plumbing', roomNumber: '108', status: 'Pending', dateSubmitted: '2026-10-03' }]);
    assert.equal(activity.length, 2);
    assert.equal(activity[0].path, '/maintenance');
    assert.equal(activity[1].path, '/payments');
    assert.equal(activity[1].status, 'Rejected');
    assert.equal(activity[1].title.includes('paid'), false);
});
