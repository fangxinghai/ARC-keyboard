        {/* ═══ 蓝牙 ═══ */}
        {activeCategory === "bluetooth" && (
          <div className="flex flex-col gap-3 panel-fade-enter items-center">
            {btBehavior ? (
              <>
                <p className="text-xs text-base-content/40 font-medium flex items-center gap-1.5">
                  <Bluetooth className="w-3.5 h-3.5" /> 选择蓝牙操作绑定到当前按键
                </p>
                {behaviorId !== btBehavior.id && (
                  <button onClick={() => { setBehaviorId(btBehavior.id); setParam1(0); setParam2(0); }}
                    className="btn-apple px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium">
                    <Bluetooth className="w-4 h-4 mr-1.5" /> 设为蓝牙功能
                  </button>
                )}
                {behaviorId === btBehavior.id && btMetadata && (
                  <div className="w-full max-w-2xl">
                    <div className="flex flex-wrap gap-2 justify-center items-center">
                      <BehaviorParametersPicker
                        metadata={btMetadata}
                        param1={param1}
                        param2={param2}
                        layers={layers}
                        onParam1Changed={setParam1}
                        onParam2Changed={setParam2}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="glass rounded-2xl p-5 text-center text-sm text-base-content/40">固件中未启用蓝牙功能</div>
            )}
          </div>
        )}
