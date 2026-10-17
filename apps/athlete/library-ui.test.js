import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {workout} from '../../checks/fixtures/workouts.mjs';
const require=createRequire(import.meta.url);
require('./training-core.js');require('./strength-targets.js');require('./library.js');
const results={innerHTML:''};globalThis.document={getElementById:id=>id==='libResults'?results:null};
globalThis.save=()=>{};globalThis.render=()=>{};globalThis.confirm=()=>true;
require('./library-ui.js');
beforeEach(()=>{globalThis.S={library:{templates:[workout()],assignments:{'2026-10-18':'assigned-workout'}},libUi:{screen:'list'},tab:'library',selectedDate:'2026-10-18'};});
test('saved-workout reader has no creation, editing, keypad or posting API',()=>{
 for(const name of ['create','patchTpl','picker','newEx','newCirc','patchBlock','calendar','confirmDate','openNumberPad','wizardNext'])assert.equal(LibraryView[name],undefined,name);
 const html=LibraryView.html();assert.match(html,/Assigned Strength Session/);assert.doesNotMatch(html,/Create Session|Add Exercise|Post to calendar|lib-grid/);
});
test('opening an old saved editor route falls back to the reader without changing workouts',()=>{
 S.libUi={screen:'warmup',flow:'wizard',tid:'assigned-workout',draft:{title:'unsaved'}};
 const before=JSON.stringify(S.library.templates);const html=LibraryView.html();assert.equal(S.libUi.screen,'list');assert.match(html,/Assigned Strength Session/);assert.equal(JSON.stringify(S.library.templates),before);
});
test('saved workout detail displays prescriptions and existing dates without editing controls',()=>{
 LibraryView.open('assigned-workout');const html=LibraryView.html();assert.match(html,/Back Squat/);assert.match(html,/View 2026-10-18 in Training/);assert.doesNotMatch(html,/Post to calendar|contenteditable|<textarea|<select/);
});
test('search filters existing workouts and deleting one removes its assignments',()=>{
 LibraryView.search('not found');assert.match(results.innerHTML,/No saved workouts/);
 LibraryView.search('Squat');assert.match(results.innerHTML,/Assigned Strength Session/);
 LibraryView.removeTpl('assigned-workout');assert.equal(S.library.templates.length,0);assert.deepEqual(S.library.assignments,{});
});
