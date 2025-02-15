import { SteedosActionTypeConfig } from '../types'
import { Dictionary } from '@salesforce/ts-types';
import { getObjectConfig } from '../types'
import _ = require('lodash');
var util = require('../util');
var clone = require('clone');

const _lazyLoadActions: Dictionary<any> = {};

const _actionScripts: Dictionary<any> = {};

const addActionScripts = function(json: SteedosActionTypeConfig){
    if (!json.listenTo) {
        console.log('json', json);
        throw new Error('missing attribute listenTo');
    }
    let object_name = getListenTo(json);
    if(!_actionScripts[object_name]){
        _actionScripts[object_name] = []
    }
    _actionScripts[object_name].push(json)
}

const getActionScripts = function(objectName: string){
    return _actionScripts[objectName]
}

export const loadActionScripts = function(objectName: string){
    let scripts = getActionScripts(objectName);
    _.each(scripts, function(script){
        addObjectActionConfig(clone(script));
    })
}

const addLazyLoadActions = function(objectName: string, json: SteedosActionTypeConfig){
    if(!_lazyLoadActions[objectName]){
        _lazyLoadActions[objectName] = []
    }
    _lazyLoadActions[objectName].push(json)
}

const getLazyLoadActions = function(objectName: string){
    return _lazyLoadActions[objectName]
}

const getListenTo = function(json: SteedosActionTypeConfig){
    if (!json.listenTo) {
        console.log('json', json);
        throw new Error('missing attribute listenTo');
    }

    if (!_.isString(json.listenTo) && !_.isFunction(json.listenTo)) {
        throw new Error('listenTo must be a function or string')
    }

    let listenTo: string = '';

    if (_.isString(json.listenTo)) {
        listenTo = json.listenTo
    } else if (_.isFunction(json.listenTo)) {
        listenTo = json.listenTo()
    }
    return listenTo;
}

export const loadObjectLazyActions = function(objectName: string){
    let actions = getLazyLoadActions(objectName);
    _.each(actions, function(action){
        addObjectActionConfig(clone(action));
    })
}

export const addObjectActionConfig = (json: SteedosActionTypeConfig)=>{
    let object_name = getListenTo(json);
    let object = getObjectConfig(object_name);
    if (object) {
        if(!object.listeners){
            object.listeners = {}
        }
        _.each(object.actions, function(action, key){
            if(!_.has(action, '_id') || action._id === key || !action.todo){
                if (json[key]) {
                    action.todo = json[key];
                }
            }
            if(json[`${key}Visible`]){
                action.visible = json[`${key}Visible`]
            }
        })
    } else {
        // throw new Error(`Error add action, object not found: ${object_name}`);
        addLazyLoadActions(object_name, json)
    }
}

export const loadObjectActions = function (filePath: string){
    let actions = util.loadActions(filePath)
    _.each(actions, (json: SteedosActionTypeConfig) => {
        addObjectActionConfig(json);
    })
    let buttonScripts = util.loadButtonScripts(filePath)
    _.each(buttonScripts, (json: SteedosActionTypeConfig) => {
        addObjectActionConfig(json);
        addActionScripts(json);
    })
}