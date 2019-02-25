#! /usr/bin/env node

import 'babel-polyfill';
import ProcessHelper from './helpers/ProcessHelper';
import Averta from './Averta';

ProcessHelper.initProcessEventHandlers();

Averta.init();
