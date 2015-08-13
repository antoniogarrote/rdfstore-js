(function(){

    RDFaParser = {};

    RDFaParser.parseResource = function(resource,blankPrefix, graph, defaultSubject) {
        var currentUri = jQuery.uri.base().toString();
        if(currentUri.indexOf("#") != -1) {
            currentUri = currentUri.split("#")[0];
        }

        if(resource.type === 'uri') {
            if(resource.value._string.indexOf(currentUri) != -1) {
                var suffix = resource.value._string.split(currentUri)[1];
                var defaultPrefix = defaultSubject.toString();
                if(suffix != "") {
                    defaultPrefix = defaultPrefix.split("#")[0]
                }
                return {'uri': defaultPrefix+suffix};
            } else {
                var uri = resource.value._string;
                if(uri.indexOf('file:') === 0){
                    uri = defaultSubject.scheme + '://' + defaultSubject.authority + uri.replace('file:','');
                }
                return {'uri': uri};
            }
        } else if(resource.type === 'bnode') {
            var tmp = resource.toString();
            if(tmp.indexOf("_:")===0) {
                return {'blank': resource.value + blankPrefix };
            } else {
                return {'blank': "_:"+tmp};
            }

        } else if(resource.type === 'literal') {
            return {'literal': resource.toString()};
        }
    };

    RDFaParser.parseQuad = function(graph, parsed, blankPrefix, defaultSubject) {
        var quad = {};
        quad['subject'] = RDFaParser.parseResource(parsed.subject, blankPrefix, graph, defaultSubject);
        quad['predicate'] = RDFaParser.parseResource(parsed.property, blankPrefix, graph, defaultSubject);
        quad['object'] = RDFaParser.parseResource(parsed.object, blankPrefix, graph, defaultSubject);
        quad['graph'] = graph;

        return quad;
    };

    RDFaParser.parse = function(data, graph, options, callback) {
        var nsRegExp = /\s*xmlns:(\w*)="([^"]+)"\s*/i;
        var ns = {};

        // some default attributes
        ns['og'] = jQuery.uri("http://ogp.me/ns#");
        ns['fb'] = jQuery.uri("http://www.facebook.com/2008/fbml");

        var baseRegExp  = /\s*xmlns="([^"]+)"\s*/i
        var baseMatch = baseRegExp.exec(data);

        if(baseMatch != null) {
            window['rdfaDefaultNS'] = jQuery.uri(baseMatch[1]);
        }

        var tmp = data;
        var match = nsRegExp.exec(tmp);
        var index = null;
        while(match != null) {
            ns[match[1]] = jQuery.uri(match[2]);
            tmp = tmp.slice(match.index+match[0].length, tmp.length);
            match = nsRegExp.exec(tmp);
        }

        window['globalNs'] = ns;

        var rdfa = jQuery(data).rdfa();
        var parsed = rdfa.databank.triples();
        var quads = [];
        var prefix = ""+(new Date()).getTime();
        for(var i=0; i<parsed.length; i++) {
            quads.push(RDFaParser.parseQuad(graph,parsed[i],prefix, window['rdfaCurrentSubject']));
        }

        callback(null, quads);
    };

    // RDFParser
    RDFParser = {};

    RDFParser.parse = function(data, graph) {
        var parsed = jQuery().rdf().databank.load(data).triples();
        var quads = [];
        var prefix = ""+(new Date()).getTime();
        for(var i=0; i<parsed.length; i++) {
            quads.push(RDFaParser.parseQuad(graph,parsed[i],prefix, window['rdfaCurrentSubject']));
        }

        return quads;
    };

    jQuery.fn.center = function () {
        this.css("position","absolute");

        var bounds = jQuery("#rdfstore-frontend").position();
        var height = jQuery("#rdfstore-frontend").height();
        var width = jQuery("#rdfstore-frontend").width();
        this.css("top", ((height - bounds.top) / 2) + $(window).scrollTop() - (this.height()/2) + "px");
        this.css("left", ((width - bounds.left) / 2) + $(window).scrollLeft() - (this.width()/2) + "px");

        return this;
    };

    RDFStoreFrontend = function(node,store) {
        var html = "<div id='rdfstore-frontend'>";
        html = html + "<div id='rdfstore-frontend-overlay'></div>"
        html = html + "<div id='rdfstore-window-buttons'><span data-bind='click:closeWindow, event:{mouseover: mouseOverCloseWindow, mouseout: mouseOverCloseWindow}' class='rdfstore-window-button' id='rdfstore-close-window'>x</span></div>";
        html = html + "<div id='rdfstore-frontend-menu'></div>";
        html = html + "<div id='rdfstore-frontend-query-area'></div>";
        html = html + "<div id='rdfstore-frontend-graphs-area'><div id='rdfstore-graphs-label'>GRAPHS</div></div>";
        html = html + "<div id='rdfstore-frontend-results-area'></div>";
        html = html + "<div id='rdfstore-frontend-footer'>";
        html = html + "<div class='rdfstore-footer-info' id='rdfstore-frontend-footer-current-graph' data-bind='text:selectedGraph'></div>";
        html = html + "<div class='rdfstore-footer-info' id='rdfstore-frontend-footer-next-page' data-bind='event:{ mousedown:toggleNextPage, mouseup:toggleNextPage, mouseout:maybeToggleNextPage }, click:nextResultPage'><span id='rdfstore-frontend-next-image-placeholder'>&nbsp;</span></div>";
        html = html + "<div class='rdfstore-footer-info' id='rdfstore-frontend-footer-display-pages' data-bind='text:\"page \"+currentResultPage()+\"/\"+totalResultPages()+\", (\"+allBindings().length+\" results)\"'></div>";
        html = html + "<div class='rdfstore-footer-info' id='rdfstore-frontend-footer-prev-page' data-bind='event:{ mousedown:togglePrevPage, mouseup:togglePrevPage, mouseout:maybeTogglePrevPage }, click:prevResultPage'><span id='rdfstore-frontend-prev-image-placeholder'>&nbsp;</span></div>";
        html = html + "</div>";
        html = html + "</div>"; // rdfstore-frontend

        jQuery(node).append(html);
        this.buildTemplates(node);

        this.buildQueryArea();
        this.buildMenu();
        this.buildGraphs();
        this.buildResultsArea();

        // application handler;
        this.viewModel.application = this;

        // save the root node
        this.viewModel.rootNode = node;

        // save the store
        this.viewModel.store = store;

        this.viewModel.bindingsVariables = ko.dependentObservable(function(){
                                                                      var array = new Array();
                                                                      if(this.bindings().length === 0 || this.bindings() == null) {
                                                                          return [];
                                                                      } else {
                                                                          var sample = this.bindings()[0];
                                                                          for(var p in sample) {
                                                                              array.push(p);
                                                                          }

                                                                          return array;
                                                                      }
                                                              },this.viewModel);

        this.viewModel.bindingsArray = ko.dependentObservable(function(){
                                                                  var array = new Array();
                                                                  for(var i=0; i<this.bindings().length; i++) {
                                                                      var currentBindings = this.bindings()[i];
                                                                      var nextElement = new Array();
                                                                      for(var j=0; j<this.bindingsVariables().length; j++) {
                                                                          nextElement.push(currentBindings[this.bindingsVariables()[j]]);
                                                                      };
                                                                      array.push(nextElement);
                                                                  }

                                                                  return array;
                                                              },this.viewModel);

        jQuery("#rdfstore-frontend").draggable({handle: "rdf-store-menu"});
        ko.applyBindings(this.viewModel, jQuery(node).get(0));
    };

    RDFStoreFrontend.prototype.buildTemplates = function(node) {
        var html = "<script id='sparql-graphs-template' type='text/html'>";
        html = html + "<ul id='rdf-store-graphs-list'>{{each graphs}} {{if selectedGraph()==$value}}";
        html = html + "<li class='rdf-store-graph-item rdf-store-selected-graph-item'><a href='#' data-bind='event: {click:selectGraph}'>${$value}</a></li>";
        html = html + "{{else}}<li class='rdf-store-graph-item'><a href='#' data-bind='event: {click:selectGraph}'>${$value}</a></li>{{/if}}{{/each}}</ul></script>";

        jQuery(node).append(html);

        html = "<script id='sparql-results-template' type='text/html'><table id='sparql-results-table-headers'><thead><tr>{{each bindingsVariables}}";
        html = html + "<th scope='col'>${$value}</th>{{/each}}</tr></thead></table><div id='sparql-results-table-rows'><table><tbody>{{each bindingsArray}}";
        html = html + "<tr class='{{if $index%2==0}}sparql-result-even-row{{else}}sparql-result-odd-row{{/if}}'>{{each $value }}{{if $value.token==='uri'}}";
        html = html + "<td data-bind='click: newShowBinding, event: {mouseover: tdMouseOver}'><span class='rdfstore-data-value'>${$value.value}</span>";
        html = html + "<span class='rdfstore-data-token' style='display:none'>uri</span></td>{{else}}{{if $value.token==='literal'}}";
        html = html + "<td data-bind='click: newShowBinding, event: {mouseover: tdMouseOver}'><span class='rdfstore-data-value'>${$value.value}</span>";
        html = html + "<span class='rdfstore-data-token' style='display:none'>literal</span><span class='rdfstore-data-lang'  style='display:none'>${$value.lang}</span>";
        html = html + "<span class='rdfstore-data-type'  style='display:none'>${$value.type}</span></td>{{else}}<td data-bind='click: newShowBinding, event: {mouseover: tdMouseOver}'>";
        html = html + "<span class='rdfstore-data-value'>${$value.value}</span><span class='rdfstore-data-token' style='display:none'>blank</span></td>";
        html = html + "{{/if}}{{/if}}{{/each}}</tr>{{/each}}</tbody></table></div></script>";

        jQuery(node).append(html);

        html = "<script id='sparql-template-row' type='text/html'><td>${$item.data}</td></script>";

        jQuery(node).append(html);
    };

    RDFStoreFrontend.prototype.buildGraphs = function() {
        var html = "<div id='rdfstore-frontend-graph-area-graphs' data-bind='template:{name:\"sparql-graphs-template\"}'></div>";
        jQuery('#rdfstore-frontend-graphs-area').append(html);
    };

    RDFStoreFrontend.prototype.buildMenu = function() {
        var html = "<div id='rdf-store-menu'>";
        html = html + "<div id='rdf-store-menu-load' class='rdf-store-menu-action'><a href='#' data-bind='click:newLoadGraphDialog'>load</a></div>";
        html = html + "<div id='rdf-store-menu-select-graph' class='rdf-store-menu-action'><a href='#' data-bind='click:displayGraph'>graphs</a></div>";
        html = html + "<div id='rdf-store-menu-hist-prev' class='rdf-store-menu-action'><a href='#' data-bind='click:displayPrevHistory'>prev</a></div>";
        html = html + "<div id='rdf-store-menu-hist-next' class='rdf-store-menu-action'><a href='#' data-bind='click:displayNextHistory'>next</a></div>";
        html = html + "<div id='rdf-store-menu-run' class='rdf-store-menu-action'><a href='#' data-bind='click:submitQuery'>run</a></div>";
        html = html + "<div id='rdf-store-menu-edit' class='rdf-store-menu-action'><a href='#' class='rdfstore-editing' data-bind='click:editQuery'>edit</a></div>";
        jQuery('#rdfstore-frontend-menu').append(html);
    };

    RDFStoreFrontend.prototype.buildQueryArea = function() {
        var html = "<textarea id='sparql-query-text' data-bind='text:query, event: { keyup: queryModified }'></textarea>";
        jQuery('#rdfstore-frontend-query-area').append(html);

        jQuery('#sparql-query-text').focus(function(){
                                               jQuery(this).css("background-color","#e5fff3");
                                           });
        jQuery('#sparql-query-text').blur(function(){
                                              jQuery(this).css("background-color","#ffffff");
                                          });
    };

    RDFStoreFrontend.prototype.buildResultsArea = function() {
        var html = "<div id='rdfstore-frontend-query-results' data-bind='template:{name:\"sparql-results-template\"}'></div>";
        jQuery('#rdfstore-frontend-results-area').append(html);
    };

    RDFStoreFrontend.prototype.showUriDialogModel = {
        create: function(viewModel, value) {
            this.value = value;
            this.viewModel = viewModel;
            this.id = "rdf-store-menu-show-uri-dialog"+(new Date().getTime());
            var html = "<div id='"+this.id+"' class='rdf-store-dialog'>";
            html = html + "<div class='rdfstore-dialog-title'><p>"+value+"</p></div>";
            html = html + "<div class='rdfstore-dialog-row'><span>URI:</span><input id='rdf-store-show-uri-value' type='text' value='"+value+"'></input></div>";
            html = html + "<div id='rdfstore-show-uri-row-options' class='rdfstore-options-row'>";
            html = html + "<div class='rdfstore-options-row-item' id='rdf-store-dialog-browse-uri' data-bind='click: browseUri'>browse</div>";
            html = html + "<div class='rdfstore-options-row-item' id='rdf-store-dialog-browse-store' data-bind='click: storeUri'>load</div>";
            html = html + "</div>";
            html = html + "<div class='rdfstore-dialog-actions'>";
            html = html + "<input type='submit' value='cancel' style='float:none; min-width:100px' data-bind='click:closeDialog'></input>";
            html = html + "</div>";
            html = html + "</div>";

            jQuery(viewModel.rootNode).append(html);
            jQuery("#"+this.id).css("min-height", "280px").css("height", "280px").center();

            ko.applyBindings(this, jQuery("#"+this.id).get(0));
            jQuery("#"+this.id).draggable({handle: "div.rdfstore-dialog-title"});
        },

        closeDialog: function() {
            // modal
            jQuery('#rdfstore-frontend-overlay').hide();

            jQuery("#"+this.id).remove();
        },

        browseUri: function() {
            window.open(this.value, "Browse: "+this.value);
        },

        storeUri: function() {
            this.closeDialog();
            this.application.loadGraphDialogModel.create(this.viewModel, this.value);
            this.application.loadGraphDialogModel.application = this.application;
            this.application.loadGraphDialogModel.store = this.store;
        }

    };

    RDFStoreFrontend.prototype.showLiteralDialogModel = {
        create: function(viewModel, value, lang, type) {
            this.value = value;
            this.viewModel = viewModel;
            this.id = "rdf-store-menu-show-literal-dialog"+(new Date().getTime());
            var html = "<div id='"+this.id+"' class='rdf-store-dialog'>";
            html = html + "<div class='rdfstore-dialog-title'><p>Show Literal</p></div>";
            html = html + "<div class='rdfstore-dialog-row'><span>Type:</span><input id='rdf-store-show-literal-type' type='text' value='"+type+"'></input></div>";
            html = html + "<div class='rdfstore-dialog-row'><span>Language:</span><input id='rdf-store-show-literal-language' type='text' value='"+lang+"'></input></div>";
            html = html + "<div class='rdfstore-dialog-row'><span>Value:</span><textarea id='rdf-store-show-literal-value' type='text'>"+value+"</textarea></div>";
            html = html + "<div class='rdfstore-dialog-actions' id='rdfstore-dialog-actions-show-literal'>";
            html = html + "<input type='submit' value='cancel' style='float:none; min-width:100px' data-bind='click:closeDialog'></input>";
            html = html + "</div>";
            html = html + "</div>";

            jQuery(viewModel.rootNode).append(html);
            jQuery("#"+this.id).css("min-height", "380px").css("height", "380px").center();

            ko.applyBindings(this, jQuery("#"+this.id).get(0));
            jQuery("#"+this.id).draggable({handle: "div.rdfstore-dialog-title"});
        },

        closeDialog: function() {
            // modal
            jQuery('#rdfstore-frontend-overlay').hide();

            jQuery("#"+this.id).remove();
        },

        browseUri: function() {
            window.open(this.value, "Browse: "+this.value);
        },

        storeUri: function() {
            this.closeDialog();
            this.application.loadGraphDialogModel.create(this.viewModel, this.value);
            this.application.loadGraphDialogModel.application = this.application;
            this.application.loadGraphDialogModel.store = this.store;
        }

    };

    RDFStoreFrontend.prototype.loadGraphDialogModel = {
        create: function(viewModel, uriToLoad) {
            // modal
            jQuery('#rdfstore-frontend-overlay').show();

            this.viewModel = viewModel;

            var html = "<div id='rdf-store-menu-load-dialog' class='rdf-store-dialog'>";
            html = html + "<div class='rdfstore-dialog-title'>Load remote graph</div>";
            if(uriToLoad) {
                html = html + "<div class='rdfstore-dialog-row'><span>Graph to load URI:</span><input id='rdf-store-graph-to-load' type='text' value='"+uriToLoad+"'></input></div>";
            } else {
                html = html + "<div class='rdfstore-dialog-row'><span>Graph to load URI:</span><input id='rdf-store-graph-to-load' type='text'></input></div>";
            }
            html = html + "<div class='rdfstore-dialog-row'><span>Store graph URI:</span><input id='rdf-store-graph-to-store' type='text'></input></div>";
            html = html + "<div class='rdfstore-dialog-actions'>";
            html = html + "<input type='submit' id='rdfstore-dialog-load-submit-btn' value='load' style='float:none; min-width:100px' data-bind='click:loadRemoteResource'></input>";
            html = html + "<input type='submit' value='cancel' style='float:none; min-width:100px' data-bind='click:closeDialog'></input>";
            html = html + "</div>";
            html = html + "</div>";

            jQuery(viewModel.rootNode).append(html);
            jQuery("#rdf-store-menu-load-dialog").css("min-height", "180px").css("height", "180px").center();

            ko.applyBindings(this, jQuery("#rdf-store-menu-load-dialog").get(0));
            jQuery("#rdf-store-menu-load-dialog").draggable({handle: "div.rdfstore-dialog-title"});
        },

        closeDialog: function() {
            // modal
            jQuery('#rdfstore-frontend-overlay').hide();
            jQuery("#rdf-store-menu-load-dialog").remove();
            jQuery("#rdfstore-dialog-load-submit-btn").attr('disabled',false);
        },

        loadRemoteResource: function() {
            var remoteUri = jQuery("#rdf-store-graph-to-load").val();
            var uriToStore = jQuery("#rdf-store-graph-to-store").val();
            if(uriToStore === '' || uriToStore==null) {
                uriToStore = this.store.engine.lexicon.defaultGraphUri;
            }
            var that = this;
            window['rdfaDefaultNS'] = jQuery.uri(remoteUri);
            window['rdfaCurrentSubject'] = jQuery.uri(remoteUri);

            jQuery("#rdfstore-dialog-load-submit-btn").attr('disabled',true);

            this.store.load('remote',
                            remoteUri,
                            uriToStore,
                            function(err, quads) {
                                jQuery("#rdfstore-dialog-load-submit-btn").attr('disabled',false);
                                if(!err) {
                                    that.store.registeredGraphs(function(err, tmp){
                                        var graphs = ['default'];
                                        for(var i=0; i<tmp.length; i++) {
                                            graphs.push(tmp[i].valueOf());
                                        }
                                        that.viewModel.graphs(graphs);
                                        that.closeDialog();
                                        alert("Graph successfully loaded: "+quads+" triples added.");
                                    });
                                } else {
                                    alert("Error loading graph: "+quads);
                                }
                            });
        }

    };

    RDFStoreFrontend.prototype.viewModel = {
        rootNode: null,
        graphs: ko.observable(['default']),
        selectedGraph: ko.observable('default'),

        selectGraph: function(event) {
            var graphText = event.currentTarget.text;
            this.displayGraph();
            this.selectedGraph(graphText);
         },

         modified: true,
         lastQuery: null,

         queryModified: function(event) {
             if(this.modified === false && this.lastQuery != null) {
                 var prevs = this.prevHistory();
                 var nexts = this.nextHistory();
                 prevs.push(this.lastQuery);
                 prevs = prevs.concat(nexts);
                 this.prevHistory(prevs);
                 this.nextHistory([]);
                 this.modified = true;
                 this.lastQuery = null;
             }
         },

         query: ko.observable('SELECT * WHERE { ?s ?p ?o }'),

         prevHistory: ko.observable([]),

         nextHistory: ko.observable([]),

         bindingsPerPage: ko.observable(50),

         allBindings: ko.observable([]),

         bindings: ko.observable([]),

         totalResultPages: ko.observable(0),

         currentResultPage: ko.observable(0),

         prevResultPage: function() {
            var height = jQuery("#rdfstore-frontend-query-results").height();
            var tableHeight = jQuery("#sparql-results-table-rows").height();
             var currentResultPage = this.currentResultPage();
             if(currentResultPage > 1) {
                 currentResultPage = currentResultPage - 1;
                 var startBindings = (currentResultPage-1) * this.bindingsPerPage();
                 this.currentResultPage(currentResultPage);
                 this.bindings(this.allBindings().slice(startBindings, startBindings+this.bindingsPerPage()));
                jQuery("#rdfstore-frontend-results-area").height(height);
                jQuery("#rdfstore-frontend-query-results").height(height);
                jQuery("#sparql-results-table-rows").height(tableHeight);
                jQuery("#sparql-results-table-headers").width(jQuery("#sparql-results-table-rows").width()-5);
                jQuery("#sparql-results-table-rows").width(jQuery("#sparql-results-table-rows").width()-5);
                jQuery("#sparql-results-table-rows").css('margin-left','5px');
                jQuery("#sparql-results-table-headers th").css('width',jQuery("#sparql-results-table-rows td").css('width'));
             }
         },

        toggleNextPage: function() {
            if(jQuery("#rdfstore-frontend-next-image-placeholder").attr('class') === 'rdfstore-next-image-mousedown') {
                jQuery("#rdfstore-frontend-next-image-placeholder").attr('class','');
            } else {
                jQuery("#rdfstore-frontend-next-image-placeholder").attr('class','rdfstore-next-image-mousedown');
            }
        },
        maybeToggleNextPage: function() {
            if(jQuery("#rdfstore-frontend-next-image-placeholder").attr('class') === 'rdfstore-next-image-mousedown') {
                jQuery("#rdfstore-frontend-next-image-placeholder").attr('class','');
            }
        },

        togglePrevPage: function() {
            if(jQuery("#rdfstore-frontend-prev-image-placeholder").attr('class') === 'rdfstore-prev-image-mousedown') {
                jQuery("#rdfstore-frontend-prev-image-placeholder").attr('class','');
            } else {
                jQuery("#rdfstore-frontend-prev-image-placeholder").attr('class','rdfstore-prev-image-mousedown');
            }
        },

        maybeTogglePrevPage: function() {
            if(jQuery("#rdfstore-frontend-prev-image-placeholder").attr('class') === 'rdfstore-prev-image-mousedown') {
                jQuery("#rdfstore-frontend-prev-image-placeholder").attr('class','');
            }
        },

        nextResultPage: function() {
            var height = jQuery("#rdfstore-frontend-query-results").height();
            var tableHeight = jQuery("#sparql-results-table-rows").height();
            var currentResultPage = this.currentResultPage();
            var maxPages = Math.ceil(this.allBindings().length / this.bindingsPerPage());
            if(currentResultPage<maxPages) {
                var startBindings = currentResultPage * this.bindingsPerPage();
                currentResultPage = currentResultPage + 1;
                this.currentResultPage(currentResultPage);
                this.bindings(this.allBindings().slice(startBindings, startBindings+this.bindingsPerPage()));
                jQuery("#rdfstore-frontend-query-results").height(height);
                jQuery("#rdfstore-frontend-results-area").height(height);
                jQuery("#sparql-results-table-rows").height(tableHeight);
                jQuery("#sparql-results-table-headers").width(jQuery("#sparql-results-table-rows").width()-5);
                jQuery("#sparql-results-table-rows").width(jQuery("#sparql-results-table-rows").width()-5);
                jQuery("#sparql-results-table-rows").css('margin-left','5px');
                jQuery("#sparql-results-table-headers th").css('width',jQuery("#sparql-results-table-rows td").css('width'));
            }
        },

        displayPrevHistory: function() {
            var prevs = this.prevHistory();
            var nexts = this.nextHistory();
            if(prevs.length > 0 ) {
                var query = prevs.pop();
                if(this.lastQuery != null) {
                    nexts.unshift(this.lastQuery);
                }

                jQuery('#sparql-query-text').val(query);

                this.prevHistory(prevs);
                this.nextHistory(nexts);
                this.lastQuery = query;
                this.modified = false;
            }
        },

        displayNextHistory: function() {
            var nexts = this.nextHistory();
            var prevs = this.prevHistory();
            if(nexts.length > 0 ) {
                var query = nexts.shift();
                if(this.lastQuery != null) {
                    prevs.push(this.lastQuery)
                }

                jQuery('#sparql-query-text').val(query);

                this.lastQuery = query;
                this.modified = false;
                this.prevHistory(prevs);
                this.nextHistory(nexts);
            }
        },

        displayGraph: function() {
            if(jQuery("#rdfstore-frontend-graphs-area").css('width') == '50%') {
                jQuery("#rdfstore-frontend-graphs-area").css('width','0%');
                setTimeout(function() {
                    jQuery('#rdfstore-graphs-label').toggle();
                    if(jQuery('#rdfstore-frontend-graph-area-graphs').css('display') === 'block') {
                        jQuery('#rdfstore-frontend-graph-area-graphs').css('display','none')
                    } else {
                        jQuery('#rdfstore-frontend-graph-area-graphs').css('display','block')
                    }
                },100);
            } else {
                jQuery("#rdfstore-frontend-graphs-area").css('width','50%');
                setTimeout(function() {
                    jQuery('#rdfstore-graphs-label').toggle();
                    if(jQuery('#rdfstore-frontend-graph-area-graphs').css('display') === 'block') {
                        jQuery('#rdfstore-frontend-graph-area-graphs').css('display','none')
                    } else {
                        jQuery('#rdfstore-frontend-graph-area-graphs').css('display','block')
                    };
                }, 300);
            }
        },

        editQuery: function() {
            if(jQuery("#rdf-store-menu-edit a").attr('class') === 'rdfstore-not-editing') {
                jQuery("#rdfstore-frontend-query-area").show();
                var height = jQuery("#rdfstore-frontend-results-area").height();
                jQuery("#rdfstore-frontend-results-area").height(height-120);

                height = jQuery("#rdfstore-frontend-graphs-area").height();
                jQuery("#rdfstore-frontend-graphs-area").height(height-120);

                height = jQuery("#sparql-results-table-rows").height();
                jQuery("#sparql-results-table-rows").height(height-120);

                height = jQuery("#rdfstore-frontend-query-results").height();
                jQuery("#rdfstore-frontend-query-results").height(height-120);
                jQuery("#rdf-store-menu-edit a").attr('class', 'rdfstore-editing')
            } else {
                jQuery("#rdfstore-frontend-query-area").hide();
                var height = jQuery("#rdfstore-frontend-results-area").height();
                jQuery("#rdfstore-frontend-results-area").height(height+120);
                height = jQuery("#rdfstore-frontend-graphs-area").height();
                jQuery("#rdfstore-frontend-graphs-area").height(height+120);
                height = jQuery("#sparql-results-table-rows").height();
                jQuery("#sparql-results-table-rows").height(height+120);
                height = jQuery("#rdfstore-frontend-query-results").height();
                jQuery("#rdfstore-frontend-query-results").height(height+120);
                jQuery("#rdf-store-menu-edit a").attr('class', 'rdfstore-not-editing')
            }
        },

        submitQuery: function() {
            var query = jQuery('#sparql-query-text').val();
            var that = this;
            var callback = function(err,results){
                if(!err) {
                    if(that.lastQuery == null) {
                        that.lastQuery = query;
                        that.modified = false;
                    }

                    that.store.registeredGraphs(function(err, tmp){
                        var graphs = ['default'];
                        for(var i=0; i<tmp.length; i++) {
                            graphs.push(tmp[i].valueOf());
                        }
                        that.graphs(graphs);
                    });

                    that.allBindings(results || []);
                    that.bindings(results.slice(0,that.bindingsPerPage()));
                    that.totalResultPages(Math.ceil(results.length/that.bindingsPerPage()))
                    that.currentResultPage(1);

                    jQuery("#sparql-results-table-headers").width(jQuery("#sparql-results-table-rows").width()-5);
                    jQuery("#sparql-results-table-rows").width(jQuery("#sparql-results-table-rows").width()-5);
                    jQuery("#sparql-results-table-rows").css('margin-left','5px');
                    jQuery("#sparql-results-table-headers th").css('width',jQuery("#sparql-results-table-rows td").css('width'));
                } else {
                    alert("Error executing query: "+results);
                }
            };
            if(this.selectedGraph() === 'default') {
                this.store.execute(query, callback);
            } else {
                this.store.execute(query,[this.selectedGraph()],[],callback);
            }
        },

        tdMouseOver: function(event) {
            jQuery('td.rdfstore-td-over').attr('class','');
            jQuery(event.currentTarget).attr('class', 'rdfstore-td-over');
        },

        mouseOverMinWindow: function(event) {
            var current = jQuery('#rdf-store-min-window').attr('class');
            if(current.indexOf("rdfstore-window-button-over") == -1) {
                jQuery('#rdf-store-min-window').attr('class', "rdfstore-window-button rdfstore-window-button-over");
            } else {
                jQuery('#rdf-store-min-window').attr('class', "rdfstore-window-button");
            }
        },

        mouseOverCloseWindow: function(event) {
            var current = jQuery('#rdfstore-close-window').attr('class');
            if(current.indexOf("rdfstore-window-button-over") == -1) {
                jQuery('#rdfstore-close-window').attr('class', "rdfstore-window-button rdfstore-window-button-over");
            } else {
                jQuery('#rdfstore-close-window').attr('class', "rdfstore-window-button");
            }
        },

        closeWindow: function() {
            jQuery("#rdfstore-frontend").remove();
        },

        newShowBinding: function(event) {
            // modal
            jQuery('#rdfstore-frontend-overlay').show();

            var kind = jQuery(event.currentTarget).find("span.rdfstore-data-token").text()
            var value = jQuery(event.currentTarget).find("span.rdfstore-data-value").text();
            if(kind === 'uri') {
                this.application.showUriDialogModel.create(this, value);
                this.application.showUriDialogModel.application = this.application;
                this.application.showUriDialogModel.store = this.store;

            } else if(kind === 'literal') {
                var lang = jQuery(event.currentTarget).find("span.rdfstore-data-lang").text();
                var type = jQuery(event.currentTarget).find("span.rdfstore-data-type").text();

                this.application.showLiteralDialogModel.create(this, value, lang, type);
                this.application.showLiteralDialogModel.application = this.application;
                this.application.showLiteralDialogModel.store = this.store;

            } else if(kind === 'blank') {

            } else {
                // wtf?
            }
        },

        newLoadGraphDialog: function() {
            this.application.loadGraphDialogModel.create(this);
            this.application.loadGraphDialogModel.application = this.application;
            this.application.loadGraphDialogModel.store = this.store;
        }
    };

    // parsers
    RDFStoreFrontend.rdfaParser = RDFaParser;
    RDFStoreFrontend.rdfParser = RDFParser;

    window['rdfstore_frontend'] = RDFStoreFrontend;
})();
