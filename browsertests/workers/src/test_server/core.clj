(ns test-server.core
  (:use [compojure.core]
        [ring.adapter.jetty]
        [clojure.contrib.json])
  (:require [compojure.route :as route]
            [compojure.handler :as handler])
  (:gen-class))

(defroutes api-routes
  (GET "/" [] {:status 302
               :headers {"Location" "/index.html"}
               :body "301 Moved"})
  (GET "/test-data" []
       {:status 200
        :headers {"Content-Type" "application/json"}
        :body (json-str {"@subject" "http://test.com/thing1"
                         "@context" {"rdfjs" "http://rdfstore-js.org/vocab/"}
                         "rdfjs:label" "test"
                         "@type" "rdfjs:TestData"})})
  (route/resources "/")
  (route/not-found "nope!"))

(def api (handler/site api-routes))

(defn start-api []
  (run-jetty api {:port 3000}))

(defn -main []
  (start-api))
