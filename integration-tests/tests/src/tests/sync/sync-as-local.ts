////////////////////////////////////////////////////////////////////////////
//
// Copyright 2022 Realm Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
////////////////////////////////////////////////////////////////////////////

import { expect } from "chai";
import { Realm } from "realm";

import { PersonSchema, IPerson } from "../../schemas/person-and-dog-with-object-ids";
import { authenticateUserBefore, importAppBefore, openRealmBefore } from "../../hooks";
import { buildAppConfig } from "../../utils/build-app-config";

describe.skipIf(environment.missingServer, "Synced Realm as local", function () {
  this.timeout(60_000); // TODO: Temporarily hardcoded until envs are set up.
  importAppBefore(buildAppConfig("with-flx").anonAuth().flexibleSync());
  authenticateUserBefore();
  openRealmBefore({
    schema: [PersonSchema],
    sync: {
      flexible: true,
    },
  });

  before(async function (this: RealmContext) {
    this.longTimeout();
    // Add a subscription
    await this.realm.subscriptions.update((subs) => {
      subs.add(this.realm.objects("Person"));
    });
    // Delete any existing object and add a single object
    this.realm.write(() => {
      this.realm.deleteAll();
      this.realm.create("Person", {
        _id: new Realm.BSON.ObjectId(),
        age: 23,
        name: "Alice",
      });
    });
  });

  it("opens when `openSyncedRealmLocally: true`", function (this: RealmContext) {
    // Close the synced Realm
    const realmPath = this.realm.path;
    this.realm.close();
    // Re-open as local Realm
    // @ts-expect-error Using `openSyncedRealmLocally: true` is an internal API
    this.realm = new Realm({ path: realmPath, openSyncedRealmLocally: true });
    expect(this.realm.schema[0].name).equals("Person");
    const [alice] = this.realm.objects<IPerson>("Person");
    expect(alice.name).equals("Alice");
  });
});
