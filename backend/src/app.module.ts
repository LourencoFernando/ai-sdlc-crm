import { DynamicModule, Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { MetaModule } from './meta/meta.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ContactsModule } from './contacts/contacts.module';
import { DealsModule } from './deals/deals.module';
import { ActivitiesModule } from './activities/activities.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({})
export class AppModule {
  /** `testSupport` adds `POST /api/test/reset`; it's on only when ACCOUNTABLE_TEST=1. */
  static create(options: { testSupport?: boolean } = {}): DynamicModule {
    const testSupport = options.testSupport ?? process.env.ACCOUNTABLE_TEST === '1';
    const extra: DynamicModule['imports'] = [];
    if (testSupport) {
      // Loaded lazily so the reset code isn't even required in normal use.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      extra.push(require('./test-support/test-support.module').TestSupportModule);
    }
    return {
      module: AppModule,
      imports: [
        PrismaModule,
        MetaModule,
        OrganizationsModule,
        ContactsModule,
        DealsModule,
        ActivitiesModule,
        DashboardModule,
        ...extra,
      ],
    };
  }
}
