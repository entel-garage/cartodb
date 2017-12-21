var CoreView = require('backbone/core-view');
var template = require('./widget-header.tpl');
var InlineEditorView = require('../../../components/inline-editor/inline-editor-view');
var VisTableModel = require('../../../data/visualization-table-model');
var templateInlineEditor = require('./inline-editor.tpl');
var ContextMenuFactory = require('../../../components/context-menu-factory-view');
var WidgetsService = require('../widgets-service');
var checkAndBuildOpts = require('../../../helpers/required-opts');

var REQUIRED_OPTS = [
  'layerDefinitionModel',
  'userActions',
  'stackLayoutModel',
  'configModel'
];

module.exports = CoreView.extend({
  events: {
    'click .js-toggle-menu': '_onToggleContextMenuClicked'
  },

  initialize: function (opts) {
    if (!this.model) throw new Error('model is required');
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._sourceNode = this._getSourceNode();

    if (this._sourceNode) {
      var tableName = this._sourceNode.get('table_name');
      this._visTableModel = new VisTableModel({
        id: tableName,
        table: {
          name: tableName
        }
      }, {
        configModel: this._configModel
      });
    }
  },

  render: function () {
    var widgetTitle = this.model.get('title');

    this.$el.html(
      template({
        title: widgetTitle,
        source: this.model.get('source'),
        sourceColor: this._layerDefinitionModel.get('color'),
        layerName: this._layerDefinitionModel.getName(),
        url: this._visTableModel ? this._visTableModel.datasetURL() : ''
      })
    );

    this._initViews();
    return this;
  },

  _initViews: function () {
    var widgetTitle = this.model.get('title');

    this._inlineEditor = new InlineEditorView({
      template: templateInlineEditor,
      renderOptions: {
        title: widgetTitle
      },
      onEdit: this._renameWidget.bind(this)
    });

    this.$('.js-header').append(this._inlineEditor.render().el);
    this.addView(this._inlineEditor);

    var menuItems = [{
      label: _t('editor.widgets.options.rename'),
      val: 'rename-widget',
      action: this._onRenameWidget.bind(this)
    }, {
      label: _t('editor.widgets.options.remove'),
      val: 'delete-widget',
      destructive: true,
      action: this._confirmDeleteWidget.bind(this)
    }];

    this._contextMenuFactory = new ContextMenuFactory({
      menuItems: menuItems
    });

    this.$('.js-context-menu').append(this._contextMenuFactory.render().el);
    this.addView(this._contextMenuFactory);
  },

  _getSourceNode: function () {
    var nodeModel = this._layerDefinitionModel.getAnalysisDefinitionNodeModel();

    var source;
    if (nodeModel.get('type') === 'source') {
      source = nodeModel;
    } else {
      var primarySource = nodeModel.getPrimarySource();
      if (primarySource && primarySource.get('type') === 'source') {
        source = primarySource;
      }
    }

    return source;
  },

  _onRenameWidget: function () {
    this._inlineEditor.edit();
  },

  _renameWidget: function () {
    var newName = this._inlineEditor.getValue();

    if (newName !== '' && newName !== this.model.get('title')) {
      this.model.set({title: newName});
      this._userActions.saveWidget(this.model);
      this.$('.js-title').text(newName).show();
      this._inlineEditor.hide();
    }
  },

  _confirmDeleteWidget: function () {
    WidgetsService.removeWidget(this.model);
  },

  _onDeleteWidget: function (modal) {
    modal.destroy();
    this._stackLayoutModel.prevStep('widgets');
    this.model.destroy();
  }
});