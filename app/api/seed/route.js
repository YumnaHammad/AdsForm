import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FormEntry from '@/models/FormEntry';

// POST - Add dummy data
export async function POST() {
  try {
    await connectDB();

    const dummyData = [
      {
        initiated_by: 'John Doe',
        product: 'Product A',
        agent_name: 'Alice Smith',
        team_brand: 'Team Alpha',
        ab_testing: 'Yes',
        budget: '5000',
        approved_by_bi: 'Yes',
        approved_by_digital: 'Yes',
        approved_by_operations: 'Yes',
        phone_number: '03001234567',
        approved_by_madam: 'Yes',
        is_complete: true,
      },
      {
        initiated_by: 'Jane Wilson',
        product: 'Product B',
        agent_name: 'Bob Johnson',
        team_brand: 'Team Beta',
        ab_testing: 'No',
        budget: '8000',
        approved_by_bi: 'Yes',
        approved_by_digital: 'No',
        approved_by_operations: 'Yes',
        phone_number: '03009876543',
        approved_by_madam: 'Yes',
        is_complete: true,
      },
      {
        initiated_by: 'Mike Brown',
        product: 'Product C',
        agent_name: 'Sarah Davis',
        team_brand: 'Team Gamma',
        ab_testing: 'Yes',
        budget: '12000',
        approved_by_bi: 'Yes',
        approved_by_digital: 'Yes',
        approved_by_operations: 'Yes',
        phone_number: '03005556677',
        approved_by_madam: 'Yes',
        is_complete: true,
      },
      {
        initiated_by: 'Emily Chen',
        product: 'Product A',
        agent_name: 'Tom Wilson',
        team_brand: 'Team Alpha',
        ab_testing: 'No',
        budget: '3000',
        approved_by_bi: 'Yes',
        approved_by_digital: 'Yes',
        approved_by_operations: 'No',
        phone_number: '03004445566',
        approved_by_madam: 'Yes',
        is_complete: true,
      },
      {
        initiated_by: 'David Lee',
        product: 'Product D',
        agent_name: 'Lisa Anderson',
        team_brand: 'Team Delta',
        ab_testing: 'Yes',
        budget: '15000',
        approved_by_bi: 'Yes',
        approved_by_digital: 'Yes',
        approved_by_operations: 'Yes',
        phone_number: '03003334455',
        approved_by_madam: 'Yes',
        is_complete: true,
      },
      {
        initiated_by: 'Sarah Martinez',
        product: 'Product B',
        agent_name: 'Chris Taylor',
        team_brand: 'Team Beta',
        ab_testing: 'Yes',
        budget: '6000',
        approved_by_bi: 'Yes',
        approved_by_digital: 'No',
        approved_by_operations: 'Yes',
        phone_number: '03002223344',
        approved_by_madam: 'No',
        is_complete: true,
      },
      {
        initiated_by: 'Robert Kim',
        product: 'Product E',
        agent_name: 'Amy White',
        team_brand: 'Team Epsilon',
        ab_testing: 'No',
        budget: '9000',
        approved_by_bi: 'Yes',
        approved_by_digital: 'Yes',
        approved_by_operations: 'Yes',
        phone_number: '03001112233',
        approved_by_madam: 'Yes',
        is_complete: true,
      },
      {
        initiated_by: 'Maria Garcia',
        product: 'Product C',
        agent_name: 'James Miller',
        team_brand: 'Team Gamma',
        ab_testing: 'Yes',
        budget: '11000',
        approved_by_bi: 'Yes',
        approved_by_digital: 'Yes',
        approved_by_operations: 'Yes',
        phone_number: '03009998877',
        approved_by_madam: 'Yes',
        is_complete: true,
      },
      {
        initiated_by: 'Kevin Zhang',
        product: 'Product A',
        agent_name: 'Emma Thompson',
        team_brand: 'Team Alpha',
        ab_testing: 'No',
        budget: '4000',
        approved_by_bi: 'No',
        approved_by_digital: 'Yes',
        approved_by_operations: 'Yes',
        phone_number: '03008887766',
        approved_by_madam: 'Yes',
        is_complete: true,
      },
      {
        initiated_by: 'Olivia Johnson',
        product: 'Product F',
        agent_name: 'Daniel Brown',
        team_brand: 'Team Zeta',
        ab_testing: 'Yes',
        budget: '20000',
        approved_by_bi: 'Yes',
        approved_by_digital: 'Yes',
        approved_by_operations: 'Yes',
        phone_number: '03007776655',
        approved_by_madam: 'Yes',
        is_complete: true,
      },
    ];

    // Clear existing completed records (optional - comment out if you want to keep existing data)
    // await FormEntry.deleteMany({ is_complete: true });

    // Insert dummy data
    const inserted = await FormEntry.insertMany(dummyData);

    return NextResponse.json({
      success: true,
      message: `Successfully added ${inserted.length} dummy records`,
      count: inserted.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to seed data' },
      { status: 500 }
    );
  }
}

