(ns test-server.core
  (:use [compojure.core]
        [ring.adapter.jetty])
  (:require [compojure.route :as route]
            [compojure.handler :as handler])
  (:gen-class))

(defroutes api-routes
  (GET "/" [] {:status 302
               :headers {"Location" "/index.html"}
               :body "301 Moved"})
  (route/resources "/")
  (route/not-found "nope!"))

(def api (handler/site api-routes))

(defn start-api []
  (run-jetty api {:port 3000}))

(defn -main []
  (start-api))
