#! /usr/bin/env node

import 'babel-polyfill';
import ProcessHelper from './helpers/ProcessHelper';
import Semverbot from './Semverbot';

ProcessHelper.initProcessEventHandlers();

Semverbot.init();
