# Pin npm packages by running ./bin/importmap

pin "application"
pin "@hotwired/turbo-rails", to: "turbo.min.js"
pin "@hotwired/stimulus-loading", to: "stimulus-loading.js"
pin "@rails/request.js", to: "@rails--request.js.js" # @0.0.11
pin "wavesurfer.js" # @7.9.0
pin "@hotwired/stimulus", to: "https://ga.jspm.io/npm:@hotwired/stimulus@3.2.2/dist/stimulus.js" # @3.2.2
pin_all_from "app/javascript/controllers", under: "controllers"
