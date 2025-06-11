package utils

import (
	"fmt"
	"runtime/debug"
	
	"github.com/sirupsen/logrus"
)

// SafeGo runs a function in a goroutine with panic recovery
func SafeGo(logger *logrus.Logger, name string, fn func()) {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				if logger != nil {
					logger.Errorf("Panic in %s: %v\nStack trace:\n%s", name, r, string(debug.Stack()))
				} else {
					fmt.Printf("Panic in %s: %v\nStack trace:\n%s\n", name, r, string(debug.Stack()))
				}
			}
		}()
		fn()
	}()
}

// SafeGoWithContext runs a function in a goroutine with panic recovery and returns any error
func SafeGoWithContext(logger *logrus.Logger, name string, fn func() error) {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				if logger != nil {
					logger.Errorf("Panic in %s: %v\nStack trace:\n%s", name, r, string(debug.Stack()))
				} else {
					fmt.Printf("Panic in %s: %v\nStack trace:\n%s\n", name, r, string(debug.Stack()))
				}
			}
		}()
		
		if err := fn(); err != nil {
			if logger != nil {
				logger.Errorf("Error in %s: %v", name, err)
			} else {
				fmt.Printf("Error in %s: %v\n", name, err)
			}
		}
	}()
}

// RecoverFunc returns a defer-able function for panic recovery
func RecoverFunc(logger *logrus.Logger, context string) func() {
	return func() {
		if r := recover(); r != nil {
			if logger != nil {
				logger.Errorf("Panic recovered in %s: %v\nStack trace:\n%s", context, r, string(debug.Stack()))
			} else {
				fmt.Printf("Panic recovered in %s: %v\nStack trace:\n%s\n", context, r, string(debug.Stack()))
			}
		}
	}
}